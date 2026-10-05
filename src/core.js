/**
 * Natural-order string comparison.
 *
 * Splits each string into alternating runs of non-digits and digits, then
 * compares those runs pairwise. Numeric runs are compared as integers so
 * that "file2" sorts before "file10". Non-numeric runs are compared
 * case-insensitively as a primary key and case-sensitively as a tiebreaker,
 * so "a" and "A" stay adjacent but in a stable, locale-independent order.
 *
 * Zero third-party dependencies; standard library only.
 */

// Pre-compiled regex. Re-compiling per call would dominate runtime for no
// benefit, and the regex itself has no mutable state.
const TOKEN = /\d+|\D+/g;

/**
 * Read a run of digits as a non-negative integer. We do not parse floats or
 * scientific notation: humans reading file lists do not read "1.5" as a
 * single numeric token, and "1.5" < "1.10" is the one thing everyone
 * agrees a natural sort must get right, which a float parse would break
 * (1.5 > 1.10). Dotted versions are out of scope for this library.
 *
 * Only the leading digits are consumed by the tokenizer, so a group can
 * be arbitrarily long without leaking non-digits in. We bound the group at
 * 15 digits to keep the result inside Number.MAX_SAFE_INTEGER; beyond that
 * we fall back to a digit-by-digit length-then-content comparison so that
 * huge numbers still sort correctly, just without being normalized.
 */
function numValue(group) {
  if (group.length > 15) {
    // Length-then-content: a longer all-digit run is the larger number,
    // and for equal lengths plain lexicographic order matches numeric order.
    return { big: true, len: group.length, text: group };
  }
  return { big: false, value: Number(group), len: group.length };
}

function compareNum(a, b) {
  if (a.big && b.big) {
    if (a.len !== b.len) return a.len - b.len;
    if (a.text < b.text) return -1;
    if (a.text > b.text) return 1;
    return 0;
  }
  if (a.big) return 1; // long digit run beats any safely-parsed number
  if (b.big) return -1;
  if (a.value < b.value) return -1;
  if (a.value > b.value) return 1;
  // Equal numeric value: shorter run sorts first, so "2" before "02".
  if (a.len !== b.len) return a.len - b.len;
  return 0;
}

function compareText(a, b) {
  // Primary key: case-insensitive, so "img" and "IMG" cluster together
  // the way a human browsing a folder expects. Tiebreaker: case-sensitive,
  // so ordering is deterministic rather than dependent on sort stability.
  const low = a.localeCompare(b, 'en', { sensitivity: 'base' });
  if (low !== 0) return low < 0 ? -1 : 1;
  const cs = a.localeCompare(b, 'en', { sensitivity: 'case' });
  return cs < 0 ? -1 : cs > 0 ? 1 : 0;
}

/**
 * Compare two strings using natural-order rules.
 *
 * @param {string} a - First string.
 * @param {string} b - Second string.
 * @returns {number} Negative if `a` precedes `b`, positive if it follows,
 *   zero if they are equal under these rules. The exact magnitude is not
 *   guaranteed; callers should only rely on the sign.
 */
export function naturalCompare(a, b) {
  if (a === b) return 0;
  const ta = String(a).match(TOKEN) || [''];
  const tb = String(b).match(TOKEN) || [''];
  const n = Math.min(ta.length, tb.length);
  for (let i = 0; i < n; i++) {
    const xa = ta[i];
    const xb = tb[i];
    const aIsNum = xa[0] >= '0' && xa[0] <= '9';
  const bIsNum = xb[0] >= '0' && xb[0] <= '9';
    if (aIsNum && bIsNum) {
      const c = compareNum(numValue(xa), numValue(xb));
      if (c !== 0) return c;
      continue;
    }
    if (aIsNum !== bIsNum) {
      // A digit run and a non-digit run at the same position: digits sort
      // before letters, matching the conventional ASCII-leaning ordering
      // that "0" < "a" in virtually every file manager.
      return aIsNum ? -1 : 1;
    }
    const c = compareText(xa, xb);
    if (c !== 0) return c;
  }
  return ta.length - tb.length;
}

/**
 * Return a copy of the array sorted by natural-order rules.
 *
 * @template T
 * @param {T[]} arr - Values to sort. Non-strings are coerced to strings
 *   for comparison.
 * @returns {T[]} A new array; the input is not mutated.
 */
export function naturalSort(arr) {
  return Array.from(arr).sort((a, b) => naturalCompare(a, b));
}
