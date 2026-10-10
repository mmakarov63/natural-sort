# natural-sort

A tiny zero-dependency ESM library for sorting strings the way a human would: `file2` before `file10`.

## Install

```bash
npm install natural-sort
```

## Usage

```js
import { naturalCompare, naturalSort } from 'natural-sort';

naturalSort(['file10', 'file2', 'file1']);
// => ['file1', 'file2', 'file10']

naturalCompare('file2', 'file10') < 0;
// => true
```

`naturalCompare(a, b)` returns a negative number when `a` should come before `b`, a positive number when it should come after, and `0` when they are equal under these rules. `naturalSort(arr)` returns a new sorted array; it does not mutate the input.

## Why

Lexicographic sort puts `file10` before `file2` because it compares character by character. Anyone browsing a folder of exported files finds that surprising. This library splits each string into runs of digits and non-digits, compares digit runs as integers, and non-digit runs case-insensitively with a case-sensitive tiebreaker. It does one thing and has no dependencies, so it can be vendored or copy-pasted without dragging in a package tree.

## Edge cases and the decisions made

- **Leading zeros are not parsed as significant.** `02` and `2` represent the same number and compare equal in value. When two runs are equal in value, the shorter run sorts first, so `['a2', 'a02', 'a002']` sorts as written. This keeps the order stable and deterministic rather than leaving it up to the host's sort stability.
- **Only leading digits form a numeric token.** A run like `1.5` is split into `1`, `.`, `5`, not parsed as a float. This is deliberate: parsing `1.5` as a float would make `1.5 > 1.10`, which is the exact surprise natural sort exists to fix. If you need semver-aware ordering, use a dedicated semver library.
- **Case folding is locale-independent**, using the root locale (`en`) via `localeCompare`. `a` and `A` compare equal on the primary key, with case as a tiebreaker, so they stay adjacent. The result is deterministic across platforms but will not match a user's locale-specific collation.
- **Very long digit runs** (more than 15 digits) exceed `Number.MAX_SAFE_INTEGER`. They are compared by length first and then lexicographically, which produces correct numeric ordering for equal or differing lengths without pretending to normalize the value.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

