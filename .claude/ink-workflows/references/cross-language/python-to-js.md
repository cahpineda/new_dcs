# Python Syntax in JavaScript/TypeScript Detection

Patterns for detecting Python-specific syntax accidentally used in JS/TS files.

## Grep Patterns

Use these regex patterns with the Grep tool to detect Python syntax in JavaScript/TypeScript files.

### CRITICAL - Python booleans/None (SyntaxError or ReferenceError)
```
\bTrue\b
\bFalse\b
\bNone\b
```
Note: Only flag when used as values, not in strings or comments. Grep will match all; manual review needed for context.

### CRITICAL - Python built-in functions (ReferenceError)
```
\b(len|str|int|float|dict|list|tuple|set|range|enumerate|zip|map|filter|sorted|reversed|sum|type)\s*\(
```
Note: `map()` is Array.prototype.map, not standalone. Flag for review.

### HIGH - Python operators/syntax in JS context
```
\b(and|or|not)\b
```
Note: `and`, `or`, `not` are reserved but unused in JS. Flag as HIGH (logic error, not crash).

### HIGH - Python string formatting
```
f"[^"]*\{
```
Note: f-strings are Python; JS uses template literals with backticks.

### HIGH - Print function (context-dependent)
```
\bprint\s*\(
```
Note: Could be valid (window.print). Flag if first argument is string/variable.

## Correction Table

These are **ALWAYS errors** in JavaScript/TypeScript:

### Boolean Literals

```regex
Pattern: \bTrue\b
Pattern: \bFalse\b
Pattern: \bNone\b
```

**Critical:** Python uses capitalized booleans, JS uses lowercase.

- `True` → `true`
- `False` → `false`
- `None` → `null` or `undefined`

### Built-in Functions

```regex
Pattern: \b(len|str|int|float|list|dict|tuple|range|enumerate|zip|sorted|reversed|sum|type)\s*\(
```

**Common conversions:**
- `len(arr)` → `arr.length`
- `str(x)` → `String(x)` or `x.toString()`
- `int(x)` → `parseInt(x, 10)` or `Math.floor(x)`
- `float(x)` → `parseFloat(x)` or `Number(x)`
- `list(iterable)` → `Array.from(iterable)` or `[...iterable]`
- `dict()` → `{}` or `new Map()`
- `range(n)` → `Array.from({length: n}, (_, i) => i)`
- `sorted(arr)` → `[...arr].sort()`
- `sum(arr)` → `arr.reduce((a, b) => a + b, 0)`
- `type(x)` → `typeof x` or `x.constructor.name`

### Print Function

```regex
Pattern: \bprint\s*\(
```

**Context-dependent:** Could be valid (window.print or custom function).

**When it's an error:**
- Used for debugging/logging → Should be `console.log()`
- First argument is a variable/string → Likely Python

**Correction:**
- `print(message)` → `console.log(message)`
- `print(f"Value: {x}")` → `console.log(\`Value: ${x}\`)`

### String Methods

```regex
Pattern: \.(upper|lower|strip|lstrip|rstrip|split|join|replace|startswith|endswith)\s*\(
```

**Common conversions:**
- `.upper()` → `.toUpperCase()`
- `.lower()` → `.toLowerCase()`
- `.strip()` → `.trim()`
- `.startswith(x)` → `.startsWith(x)`
- `.endswith(x)` → `.endsWith(x)`

### List Comprehension Syntax

```regex
Pattern: \[.+\s+for\s+.+\s+in\s+.+\]
```

**Error indicators:**
- Square brackets with `for ... in` inside
- Python-style comprehension

**Correction:**
- `[x * 2 for x in arr]` → `arr.map(x => x * 2)`
- `[x for x in arr if x > 0]` → `arr.filter(x => x > 0)`

---

*Pattern library for cross-language detection*
*Based on approach by @cahpineda*
