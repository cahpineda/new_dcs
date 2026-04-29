# PHP Functions in JavaScript/TypeScript Detection

Patterns for detecting PHP-specific functions accidentally used in JS/TS files.

## Grep Patterns

Use these regex patterns with the Grep tool to detect PHP functions in JavaScript/TypeScript files.

### CRITICAL - Type check functions (will crash immediately)
```
\b(isset|empty|is_null|is_array|is_string|is_numeric|is_int|is_object|is_bool|gettype)\s*\(
```

### CRITICAL - Array functions (ReferenceError)
```
\b(array_merge|array_push|array_pop|array_shift|array_unshift|array_slice|array_splice|array_keys|array_values|array_map|array_filter|array_reduce|in_array|array_unique|array_reverse|array_search|array_column|array_key_exists|count|sizeof)\s*\(
```

### CRITICAL - String functions (ReferenceError)
```
\b(strlen|strpos|strrpos|substr|str_replace|str_pad|strtolower|strtoupper|ucfirst|lcfirst|trim|ltrim|rtrim|explode|implode|sprintf|number_format)\s*\(
```

### HIGH - Output/debug functions
```
\b(print_r|var_dump|var_export|echo|die)\s*[\(;]
```

### HIGH - JSON & Conversion functions
```
\b(json_encode|json_decode|intval|floatval|strval|preg_match|preg_replace|file_get_contents)\s*\(
```

## Correction Table

These functions are **ALWAYS errors** in JavaScript/TypeScript:

### Type Check Functions

```regex
Pattern: \b(isset|empty|is_null|is_array|is_string|is_int|is_numeric|is_bool|is_object|gettype)\s*\(
```

**Most common errors:**
- `isset(variable)` → Check: `variable !== undefined && variable !== null`
- `empty(variable)` → Check: `!variable` or explicit checks
- `is_array(x)` → Check: `Array.isArray(x)`
- `is_string(x)` → Check: `typeof x === 'string'`

### Array Functions

```regex
Pattern: \b(array_merge|array_push|array_pop|array_shift|in_array|array_key_exists|array_keys|array_values|array_unique|array_search|count|sizeof)\s*\(
```

**Common conversions:**
- `array_merge(a, b)` → `[...a, ...b]` or `a.concat(b)`
- `array_push(arr, item)` → `arr.push(item)`
- `in_array(needle, haystack)` → `haystack.includes(needle)`
- `array_keys(obj)` → `Object.keys(obj)`
- `count(arr)` → `arr.length`

### String Functions

```regex
Pattern: \b(strlen|strpos|strrpos|substr|str_replace|explode|implode|strtolower|strtoupper|ucfirst|sprintf)\s*\(
```

**Common conversions:**
- `strlen(str)` → `str.length`
- `strpos(haystack, needle)` → `haystack.indexOf(needle)`
- `substr(str, start, length)` → `str.substring(start, start + length)`
- `str_replace(search, replace, str)` → `str.replace(search, replace)`
- `explode(delim, str)` → `str.split(delim)`
- `implode(delim, arr)` → `arr.join(delim)`
- `strtolower(str)` → `str.toLowerCase()`

### Conversion & Output Functions

```regex
Pattern: \b(intval|floatval|strval|print_r|var_dump|var_export|die)\s*\(
```

**Common conversions:**
- `intval(x)` → `parseInt(x, 10)` or `Number(x)`
- `floatval(x)` → `parseFloat(x)` or `Number(x)`
- `print_r(obj)` → `console.log(obj)` (with JSON.stringify for formatting)
- `var_dump(obj)` → `console.log(obj)`
- `die(message)` → `throw new Error(message)` or `process.exit(1)`

### JSON & Regex Functions

```regex
Pattern: \b(json_encode|json_decode|preg_match|preg_replace|file_get_contents)\s*\(
```

**Common conversions:**
- `json_encode(obj)` → `JSON.stringify(obj)`
- `json_decode(str)` → `JSON.parse(str)`
- `preg_match(pattern, str)` → `str.match(pattern)` or regex test
- `file_get_contents(path)` → `fs.readFileSync(path, 'utf8')`

---

*Pattern library for cross-language detection*
*Based on approach by @cahpineda*
