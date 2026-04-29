---
name: ink:settings
description: Configure Ink workflow settings including mode, planning depth, and feature toggles
arguments:
  - name: setting
    description: Setting to change (mode, depth, profile, feature)
    required: false
  - name: value
    description: New value for the setting
    required: false
---

# Ink Settings

Configure workflow behavior, model profiles, and feature toggles.

<objective>
View or modify Ink configuration in `.planning/config.json`.
</objective>

<execution_flow>

## Step 1: Load Current Config

```bash
CONFIG_FILE=".planning/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "No config file found. Run /ink:go to initialize project first."
  exit 1
fi
```

## Step 2: Handle Command

### View All Settings (no arguments)

Display current configuration:

```
## Ink Settings

**Project:** [name] v[version]

### Execution Mode
- **mode:** [interactive|yolo]
  - interactive: Confirm at each step (default)
  - yolo: Auto-approve all steps

### Planning Depth
- **planningDepth:** [quick|standard|comprehensive]
  - quick: Minimal planning, fast iteration
  - standard: Balanced approach (default)
  - comprehensive: Thorough research and multi-plan phases

### Model Profile
- **modelProfile:** [quality|balanced|budget]
  - Current: [profile]
  - Research: [model]
  - Planning: [model]
  - Execution: [model]
  - Verification: [model]

### Feature Toggles
| Feature | Status | Description |
|---------|--------|-------------|
| parallelResearch | [on/off] | Run 4 research agents in parallel |
| waveExecution | [on/off] | Parallel plan execution |
| planChecker | [on/off] | Validate plans before execution |
| executorAgent | [on/off] | Use executor agent for plans |
| maxConcurrentAgents | [N] | Max parallel agents |

### Context Budgets
- Orchestrator: [N]%
- Agent: [N]%

---
To change a setting:
  /ink:settings mode yolo
  /ink:settings depth comprehensive
  /ink:settings profile quality
  /ink:settings feature planChecker on
```

### Change Mode

`/ink:settings mode [interactive|yolo]`

```json
{
  "mode": "[value]"
}
```

**interactive (default):**
- Prompts for confirmation before major actions
- Shows plan preview before execution
- Allows abort at any step

**yolo:**
- Auto-approves all steps
- No confirmation prompts
- Faster but less control

### Change Planning Depth

`/ink:settings depth [quick|standard|comprehensive]`

```json
{
  "planningDepth": "[value]"
}
```

**quick:**
- Skip research phase
- Minimal task breakdown
- Best for: simple features, bug fixes

**standard (default):**
- Normal research and planning
- Balanced task granularity
- Best for: most features

**comprehensive:**
- Deep research with all 4 agents
- Detailed task breakdown
- Multiple plans per phase
- Best for: complex features, new domains

### Change Model Profile

`/ink:settings profile [quality|balanced|budget]`

```json
{
  "modelProfile": "[value]"
}
```

| Profile | Research | Planning | Execution | Verification |
|---------|----------|----------|-----------|--------------|
| quality | sonnet | opus | opus | sonnet |
| balanced | sonnet | opus | sonnet | sonnet |
| budget | sonnet | sonnet | sonnet | sonnet |

### Toggle Features

`/ink:settings feature [name] [on|off]`

Available features:
- `parallelResearch` - Run research agents in parallel
- `waveExecution` - Execute independent plans in parallel
- `planChecker` - Validate plans before execution
- `executorAgent` - Use executor agent (vs inline execution)

Example:
```
/ink:settings feature planChecker on
```

### Set Max Concurrent Agents

`/ink:settings feature maxConcurrentAgents [N]`

Controls how many agents can run in parallel during wave execution.

- Default: 3
- Range: 1-10
- Higher = faster but more resource usage

## Step 3: Update Config

Write changes to `.planning/config.json`:

```javascript
const config = JSON.parse(fs.readFileSync(CONFIG_FILE));
config[setting] = value;
fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
```

## Step 4: Confirm Change

```
Setting updated.

[setting]: [old value] → [new value]

Current profile: [modelProfile]
Current mode: [mode]
Current depth: [planningDepth]
```

</execution_flow>

<presets>

For common configurations, use these preset commands:

**Fast iteration (quick + budget + yolo):**
```
/ink:settings depth quick
/ink:settings profile budget
/ink:settings mode yolo
```

**High quality (comprehensive + quality + interactive):**
```
/ink:settings depth comprehensive
/ink:settings profile quality
/ink:settings mode interactive
```

**Default (reset to defaults):**
```
/ink:settings depth standard
/ink:settings profile balanced
/ink:settings mode interactive
```

</presets>

<success_criteria>
- Current settings displayed clearly
- Changes applied to config.json
- Confirmation shown with old/new values
- Invalid values rejected with guidance
</success_criteria>
