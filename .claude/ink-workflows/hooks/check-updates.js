#!/usr/bin/env node

/**
 * Check Updates Hook
 *
 * Runs on session start to check for and auto-install updates to ink-agent-dev-helper.
 *
 * Behavior:
 * - Reads local version from .claude/INK_VERSION
 * - Checks GitHub Releases API for latest release version (public repos)
 * - Falls back to gh CLI releases endpoint for private repos
 * - Caches results for 4 hours in ~/.ink-update-check.json
 * - AUTO-INSTALLS update when available (forced by policy)
 * - Writes notification file with update result for statusline
 * - Runs asynchronously (non-blocking)
 * - Silent execution (no stdout)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { execSync } = require('child_process');

// Constants
const GITHUB_REPO = 'inkaviation/ink-agent-dev-helper';
const CACHE_FILE = path.join(os.homedir(), '.ink-update-check.json');
const NOTIFY_FILE = path.join(os.homedir(), '.ink-update-notify.json');
const CACHE_DURATION = 4 * 60 * 60 * 1000;  // 4 hours
const NETWORK_TIMEOUT = 5000;  // 5 seconds

/**
 * Fetch a URL and return the body as string
 */
function fetchUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      { timeout: NETWORK_TIMEOUT, headers: { 'User-Agent': 'ink-update-check' } },
      (res) => {
        // Follow redirects (GitHub raw uses 302)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchUrl(res.headers.location).then(resolve);
        }
        if (res.statusCode !== 200) {
          return resolve(null);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }
    );
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', (err) => { process.stderr.write('[check-updates] HTTP error: ' + (err.message || 'unknown') + '\n'); resolve(null); });
  });
}

/**
 * Check GitHub Releases API for latest version (primary source)
 */
async function checkGitHubReleases() {
  const data = await fetchUrl(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
  );
  if (!data) return null;
  try {
    const release = JSON.parse(data);
    const tag = release.tag_name;
    if (!tag) return null;
    // Strip leading 'v' if present (e.g. "v2.1.0" → "2.1.0")
    return tag.replace(/^v/, '');
  } catch {
    return null;
  }
}

/**
 * Check GitHub Releases via gh CLI for private repos (secondary source)
 */
function checkGitHubReleasesCli() {
  try {
    const tag = execSync(
      `gh api repos/${GITHUB_REPO}/releases/latest --jq '.tag_name' 2>/dev/null`,
      { timeout: NETWORK_TIMEOUT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    if (!tag || !tag.trim()) return null;
    return tag.trim().replace(/^v/, '');
  } catch {
    return null;
  }
}

/**
 * Read cached version check result
 */
function readCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    // Check if cache is still valid
    if (Date.now() - data.timestamp < CACHE_DURATION) {
      return data;
    }
  } catch (e) {
    // Cache read error - treat as no cache
  }
  return null;
}

/**
 * Write cache file
 */
function writeCache(latestVersion, localVersion) {
  try {
    const cacheData = {
      timestamp: Date.now(),
      latestVersion: latestVersion,
      localVersion: localVersion,
      updateAvailable: compareVersions(localVersion, latestVersion) < 0
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
  } catch (e) {
    // Silent fail on cache write error
  }
}

/**
 * Get local installed version from .claude/INK_VERSION file
 * Returns { version } or null
 */
function getLocalVersionAndPlatform() {
  const projectRoot = path.resolve(__dirname, '..', '..', '..');
  const versionPath = path.join(projectRoot, '.claude', 'INK_VERSION');

  try {
    if (fs.existsSync(versionPath)) {
      const version = fs.readFileSync(versionPath, 'utf8').trim();
      if (version && /^\d+\.\d+\.\d+/.test(version)) {
        return { version };
      }
    }
  } catch (e) {
    // Version file unreadable
  }

  return null;
}

/**
 * Auto-install the latest version using npx installer
 * Returns true if install succeeded, false otherwise
 */
function autoInstall() {
  const projectRoot = path.resolve(__dirname, '..', '..', '..');

  try {
    execSync(
      'npm exec --yes -- github:inkaviation/ink-agent-dev-helper',
      {
        cwd: projectRoot,
        timeout: 60000,  // 60 seconds max
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );
    return true;
  } catch (e) {
    // Install failed — will fall back to notification only
    return false;
  }
}

/**
 * Compare two semantic versions
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
  }
  return 0;
}

/**
 * Create or remove notification file
 * @param {string} status - 'updated', 'available', or null (no update)
 * @param {string} latestVersion - version string
 */
function updateNotification(status, latestVersion) {
  try {
    if (status) {
      const notifyData = {
        version: latestVersion,
        status: status,  // 'updated' = auto-installed, 'available' = install failed
        timestamp: Date.now()
      };
      fs.writeFileSync(NOTIFY_FILE, JSON.stringify(notifyData, null, 2));
    } else {
      // No update needed - remove notification file if exists
      if (fs.existsSync(NOTIFY_FILE)) {
        fs.unlinkSync(NOTIFY_FILE);
      }
    }
  } catch (e) {
    // Silent fail on notification update
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Get local version and platform from INK_VERSION file (needed for cache validation)
    let local = getLocalVersionAndPlatform();

    // If INK_VERSION missing (legacy install or deleted), skip cache and force update
    if (!local) {
      local = { version: '0.0.0' };
    } else {
      // Check cache first — but invalidate if local version changed since cache was written
      const cached = readCache();
      if (cached) {
        const cacheVersionMismatch = cached.localVersion !== local.version;
        if (!cacheVersionMismatch) {
          // Cache hit — if already updated in this cache window, skip
          if (!cached.updateAvailable) {
            updateNotification(null, null);
            process.exit(0);
            return;
          }
          // Cache says update available but hasn't been installed yet — fall through to install
        }
        // else: version changed since cache was written — run fresh check
      }
    }


    // Check remote version: GitHub Releases API → gh CLI releases
    let latestVersion = await checkGitHubReleases();
    if (!latestVersion) {
      latestVersion = checkGitHubReleasesCli();
    }

    if (!latestVersion) {
      // All sources unavailable — exit silently
      process.exit(0);
      return;
    }

    // Compare versions
    const updateAvailable = compareVersions(local.version, latestVersion) < 0;

    if (updateAvailable) {
      // AUTO-INSTALL: Run installer
      const installed = autoInstall();

      if (installed) {
        // Verify the install actually updated INK_VERSION
        const postInstall = getLocalVersionAndPlatform();
        const actualVersion = postInstall ? postInstall.version : local.version;

        if (compareVersions(actualVersion, latestVersion) >= 0) {
          // Confirmed — INK_VERSION was actually updated
          writeCache(latestVersion, actualVersion);
          updateNotification('updated', latestVersion);
        } else {
          // Install ran but version didn't change (e.g. package.json not bumped in release)
          writeCache(latestVersion, actualVersion);
          updateNotification('available', latestVersion);
        }
      } else {
        // Install failed — cache as available, notify statusline
        writeCache(latestVersion, local.version);
        updateNotification('available', latestVersion);
      }
    } else {
      // Already up to date
      writeCache(latestVersion, local.version);
      updateNotification(null, null);
    }

    process.exit(0);

  } catch (error) {
    // Silent failure - don't block session start
    process.exit(0);
  }
}

// Run immediately (don't wait for stdin - this is a background hook)
main();
