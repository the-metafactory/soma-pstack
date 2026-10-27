# slugline

`slugline` turns a title into a URL-safe slug. It exports `slugify` and installs a `slugline` command.

## Tutorial: make your first slug <!-- mode: tutorial -->

We will turn a title with accents into a slug.

1. Create a file named `try.ts` with this content:

   ```ts
   import { slugify } from "slugline";
   console.log(slugify("Crème Brûlée: A Tutorial!"));
   ```

2. Run it with `bun try.ts`.

   The command prints `creme-brulee-a-tutorial`.

3. Change the title to `Hello   World` and run it again.

   The command prints `hello-world`. Runs of spaces and punctuation collapse into one separator. Reference has the full rules.

You now have a working call to `slugify`.

## How to use a different separator <!-- mode: how-to -->

To get underscores instead of hyphens on the command line, pass `--separator`:

```sh
slugline --separator _ "Hello World"
```

To do the same in code, pass `separator` in the options object:

```ts
slugify("Hello World", { separator: "_" });
```

Use `-` or `_`. `slugify` builds a regular expression from the separator without escaping it, so a separator such as `.` makes `slugify("Hello World", { separator: "." })` return an empty string.

## Reference: `slugify` and `slugline` <!-- mode: reference -->

### `slugify(input, options?)`

Returns a string.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `separator` | `string` | `"-"` | The string placed between words. |
| `maxLength` | `number` | `80` | The longest slug returned. |

Steps, in order:

1. Decompose accents with `normalize("NFKD")` and drop the combining marks.
2. Lowercase the text.
3. Replace every run of characters outside `a-z0-9` with `separator`.
4. Strip leading and trailing separators.
5. If the slug is longer than `maxLength`, cut it at `maxLength` and drop the partial word at the end.

### `slugline [--separator <char>] <text>`

Prints the slug of `<text>` to standard output. Joins several arguments with a space. With no text, prints `usage: slugline [--separator <char>] <text>` to standard error and exits with status 2.

## Explanation: why slugs are ASCII only <!-- mode: explanation -->

`slugify` drops every character outside `a-z0-9` after it strips accents. A title in Greek or Japanese therefore produces an empty slug.

That is a choice, not an accident. A slug appears in URLs, file names, and shell commands, and ASCII is the one set of characters that all three accept without escaping. Percent-encoded slugs are legal in URLs, but they are unreadable in logs and break in tools that decode them twice. The cost is that scripts without a Latin transliteration get no slug. If you need those, transliterate the input before you call `slugify`. This package does not, because a correct transliteration depends on the language and a wrong one is worse than none.
