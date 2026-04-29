# JavaScript Syntax in Python Detection

Patterns for detecting JavaScript-specific syntax accidentally used in Python files.

## Grep Patterns

Use these regex patterns with the Grep tool to detect JavaScript syntax in Python files.

### CRITICAL - JS booleans/null (NameError in Python)
```
\btrue\b
\bfalse\b
\bnull\b
\bundefined\b
```
Note: Python uses `True`, `False`, `None`. JS lowercase versions cause NameError.

### CRITICAL - JS variable declarations (SyntaxError)
```
\b(const|let|var)\s+\w+
```

### HIGH - JS functions in Python (NameError)
```
\b(console\.log|parseInt|parseFloat|isNaN|JSON\.parse|JSON\.stringify)\s*\(
```

### HIGH - JS array/object methods on Python collections
```
\.(push|pop|shift|unshift|splice|slice|forEach|indexOf|includes|join|split|map|filter|reduce)\s*\(
```
Note: Some of these exist as Python methods (e.g., .pop(), .split(), .join()) but with different semantics. Flag for review.

### HIGH - JS syntax patterns
```
===
!==
\bfunction\s+\w+
=>\s*\{
```
Note: Arrow functions, strict equality, function keyword - all SyntaxError in Python.

## Correction Table

These are **ALWAYS errors** in Python:

### Boolean & Null Literals

```regex
Pattern: \btrue\b
Pattern: \bfalse\b
Pattern: \bnull\b
Pattern: \bundefined\b
```

**Critical:** JavaScript uses lowercase, Python uses capitalized.

- `true` → `True`
- `false` → `False`
- `null` → `None`
- `undefined` → `None` (no direct equivalent)

### Comparison Operators

```regex
Pattern: ===
Pattern: !==
```

**JavaScript strict equality has no Python equivalent.**

- `x === y` → `x == y` (Python == is like JS ===)
- `x !== y` → `x != y`

### Console Functions

```regex
Pattern: \bconsole\.(log|error|warn|info|debug)\s*\(
```

**Conversions:**
- `console.log(x)` → `print(x)`
- `console.error(x)` → `print(x, file=sys.stderr)` (with import)
- `console.warn(x)` → `warnings.warn(x)` (with import)

### Variable Declarations

```regex
Pattern: \b(const|let|var)\s+\w+\s*=
```

**Python doesn't use declaration keywords.**

- `const x = 5` → `x = 5` (use UPPER_CASE for constants)
- `let y = 10` → `y = 10`
- `var z = 15` → `z = 15`

### Function Declarations

```regex
Pattern: \bfunction\s+\w+\s*\(
```

**Python uses `def` keyword.**

- `function foo(x) { ... }` → `def foo(x): ...`

### Object/Array Methods

```regex
Pattern: \b(Array\.isArray|Object\.keys|Object\.values|Math\.floor|Math\.ceil|Math\.round)\s*\(
```

**Conversions:**
- `Array.isArray(x)` → `isinstance(x, list)`
- `Object.keys(obj)` → `obj.keys()` or `list(obj.keys())`
- `Object.values(obj)` → `obj.values()` or `list(obj.values())`
- `Math.floor(x)` → `math.floor(x)` (with import)
- `Math.ceil(x)` → `math.ceil(x)` (with import)

### JSON Functions

```regex
Pattern: \bJSON\.(parse|stringify)\s*\(
```

**Conversions:**
- `JSON.parse(str)` → `json.loads(str)` (with import)
- `JSON.stringify(obj)` → `json.dumps(obj)` (with import)

### parseInt/parseFloat

```regex
Pattern: \b(parseInt|parseFloat)\s*\(
```

**Conversions:**
- `parseInt(x, 10)` → `int(x)`
- `parseFloat(x)` → `float(x)`

---

*Pattern library for cross-language detection*
*Based on approach by @cahpineda*
