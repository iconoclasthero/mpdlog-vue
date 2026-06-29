# Search Query Syntax

This search interface supports a flexible query language inspired by **MPD filters** and **shell-style escaping**.  
When in doubt, behavior should resemble **bash command-line parsing**.

----------
# Basic Search

A plain word searches all tags using a substring match.

```  
dylan  
```

Equivalent to:

```  
any contains "dylan"  
```

Multiple words imply **AND**.

```  
bob dylan  
```

Equivalent to:

```  
any contains "bob" AND any contains "dylan"  
```

----------

# Escaping (Bash-Style)

Spaces can be escaped with `\`:

```  
bob\ dylan  
```

Equivalent to:

```  
any contains "bob dylan"  
```

Backslashes with `\\`:
```
file contains love\ minus\ zero\\no\ limit
```
Equvalent to:
```
file contains "love minus zero\no limit"
```

This behaves like **bash command line escaping**.

----------

# Quoting

Both single and double quotes are supported.

```  
artist:"Bob Dylan"  
artist:'Bob Dylan'  
```

Quotes can contain escaped characters.

```  
title:"Bob "The Man" Dylan"  
```

----------

# Field Search

Search specific tags using `:` or `=`.

```  
artist:dylan  
artist="Bob Dylan"  
album:infidels  
```

Both `:` and `=` mean **equality**.

```  
artist:dylan  
```

is interpreted as

```  
artist == "dylan"  
```

----------

# Field Aliases

Short aliases are supported:

| Alias | Field  |
| ------ | ----- |
| a | artist |
|aa | albumartist|
| al| album | 
|t | title |
| g | genre | 
| y | date |
| tr | track |

Example:

```  
a:dylan al:infidels  
```

Equivalent to:

```  
artist == "dylan" AND album == "infidels"  
```

----------

# Comparison Operators

The following operators are supported:

| Operator | Meaning |
| ----------- | -----------| 
| `=` or `:` |  equals |
| `!=` | not equal |
| `>` | greater than |
| `>=` | greater than or equal |
| `<` | less than |
| `<=` | less than or equal |

Examples:

```  
track >= 5  
date >= 1975  
```

----------

# Substring Matching

Use `contains`.

```  
title contains love  
```

Equivalent to:

```  
title contains "love"  
```

----------

# Prefix Matching

Use `starts`.

```  
title starts love  
```

Equivalent to:

```  
title starts_with "love"  
```

----------

# Regular Expressions

Regex search uses `~`.

```  
artist~"^bob"  
```

Equivalent to:

```  
artist =~ "^bob"  
```

Negated regex:

```  
artist!~"^bob"  
```

----------

# Negation

Prefix a condition with `!`.

```  
!artist:dylan  
```

Equivalent to:

```  
!(artist == "dylan")  
```

----------

# Boolean Operators

## AND

AND is **implicit**.

```  
artist:dylan album:infidels  
```

Explicit AND also works:

```  
artist:dylan AND album:infidels  
artist:dylan && album:infidels  
artist:dylan & album:infidels  
```

----------

## OR

OR uses `|`, `||`, or `OR`.

```  
artist:dylan | artist:cohen  
```

Equivalent to:

```  
artist:dylan OR artist:cohen  
```

----------

# Value Lists (Repetition)

A field can match multiple values using `,` or `;`.

```  
artist:dylan,cohen,young  
```

Equivalent to:

```  
artist:dylan OR artist:cohen OR artist:young  
```

----------

# Unary Filters

Some filters take only a value.

Supported unary filters include:

-   `base`
    
-   `modified-since`
    
-   `added-since`
    

Example:

```  
base "Bob Dylan"  
```

or using shell-style escaping:

```  
base Bob\ Dylan  
```

Example with a filesystem path:

```  
base Bob\ Dylan/Bob\ Dylan\ --\ Infidels\ \(1983\)
```

Equivalent to:

```  
base "Bob Dylan/Bob Dylan -- Infidels (1983)"
```

----------

# Examples

Search by artist:

```  
a:dylan  
```

Artist and album:

```  
a:dylan al:infidels  
```

Phrase search:

```  
bob\ dylan  
```

Directory search:

```  
base Bob\ Dylan/Live  
```

Regex search:

```  
artist~"^bob"  
```

Multiple artists:

```  
artist:dylan,cohen,young  
```

Mixed query:

```  
a:dylan al:infidels | a:cohen  
```

----------

# Escaping Characters

The following escapes are supported:

Escape

Result

`\`

space

`\"`

double quote

`\'`

single quote

`\\`

backslash

`\(`

literal `(`

`\)`

literal `)`

Example:

```  
title:rock!  
```

Matches:

```  
rock!  
```

----------

# Summary

Key principles:

-   Behavior resembles **bash command-line parsing**
    
-   Spaces can be escaped using `\`
    
-   AND is implicit
    
-   OR uses `|`
    
-   Fields can use short aliases
    
-   Bare words search all tags
    
-   Unary filters support directory and timestamp searches
    

This allows powerful queries while keeping the syntax **short and easy to type**.
More background on what MPD can actually do *may* be gleaned from [the MPD protocol documentation].(https://mpd.readthedocs.io/en/latest/protocol.html#filters)
