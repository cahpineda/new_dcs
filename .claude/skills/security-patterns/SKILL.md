---
name: security-patterns
description: Common security patterns and implementations. Use when implementing authentication, authorization, encryption, or handling sensitive data.
disable-model-invocation: false
---

# Security Patterns

Common security patterns and implementations.

## Authentication Patterns

### JWT Authentication
```javascript
// Generate token
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verify token
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Auth required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Session-Based Auth
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: true,      // HTTPS only
    httpOnly: true,    // No JS access
    sameSite: 'strict', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000,
  },
}));
```

## Authorization Patterns

### Role-Based Access Control (RBAC)
```javascript
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

app.delete('/users/:id', requireAuth, requireRole('admin'), deleteUser);
```

### Permission-Based
```javascript
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

app.post('/products', requirePermission('products:create'), createProduct);
```

### Resource-Based (Ownership)
```javascript
async function requireOwnership(req, res, next) {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (resource.ownerId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  req.resource = resource;
  next();
}
```

## Password Security

### Hashing with bcrypt
```javascript
// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

### Password Requirements
```javascript
const passwordSchema = Joi.string()
  .min(8)
  .pattern(/[A-Z]/)  // Uppercase
  .pattern(/[a-z]/)  // Lowercase
  .pattern(/[0-9]/)  // Number
  .pattern(/[^A-Za-z0-9]/); // Special char
```

## Input Validation

### Whitelist Approach
```javascript
const schema = Joi.object({
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(150),
  role: Joi.string().valid('user', 'admin'),
});

const { error, value } = schema.validate(req.body);
if (error) throw new ValidationError(error.message);
```

### SQL Injection Prevention
```javascript
// ❌ NEVER
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ ALWAYS
const query = 'SELECT * FROM users WHERE id = $1';
const result = await db.query(query, [userId]);
```

## XSS Prevention

### Escape Output
```javascript
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### Content Security Policy
```javascript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  },
}));
```

## CSRF Protection

### SameSite Cookies
```javascript
res.cookie('token', token, {
  sameSite: 'strict',
  secure: true,
  httpOnly: true,
});
```

### CSRF Tokens
```javascript
const csrfProtection = csrf({ cookie: true });

app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

app.post('/process', csrfProtection, (req, res) => {
  res.send('Processed!');
});
```

## Rate Limiting

### Global Rate Limiting
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // 100 requests per window
});

app.use('/api/', limiter);
```

### Per-Endpoint
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts',
});

app.post('/login', authLimiter, login);
```

## Encryption

### Symmetric (AES)
```javascript
function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, encrypted, tag };
}

function decrypt(encrypted, key, iv, tag) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

## Secrets Management

### Environment Variables
```javascript
// Load from .env
require('dotenv').config();

// Validate required secrets
const required = ['DATABASE_URL', 'JWT_SECRET', 'API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing ${key}`);
  }
}
```

### Secrets Manager (Production)
```javascript
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

async function getSecret(name) {
  const client = new SecretsManager({ region: 'us-east-1' });
  const response = await client.getSecretValue({ SecretId: name });
  return JSON.parse(response.SecretString);
}
```

## Audit Logging

```javascript
async function logSecurityEvent(event) {
  await AuditLog.create({
    type: event.type,          // LOGIN, LOGOUT, DELETE, etc.
    userId: event.userId,
    resource: event.resource,
    action: event.action,
    ip: event.ip,
    userAgent: event.userAgent,
    timestamp: new Date(),
    metadata: event.metadata,
  });
}

// Usage
await logSecurityEvent({
  type: 'LOGIN_SUCCESS',
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});
```

## Common Vulnerabilities

### Insecure Direct Object Reference (IDOR)
```javascript
// ❌ Vulnerable
app.get('/documents/:id', (req, res) => {
  const doc = await Document.findById(req.params.id);
  res.json(doc); // Any user can access any document!
});

// ✅ Secure
app.get('/documents/:id', requireAuth, async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  if (doc.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(doc);
});
```

## Best Practices

1. Never trust user input
2. Use parameterized queries
3. Hash passwords with bcrypt/argon2
4. Implement rate limiting
5. Use HTTPS everywhere
6. Set security headers
7. Validate on server, not just client
8. Log security events
9. Keep dependencies updated
10. Principle of least privilege
