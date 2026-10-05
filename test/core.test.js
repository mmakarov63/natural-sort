import { test } from 'node:test';
import assert from 'node:assert/strict';
import { naturalCompare, naturalSort } from '../src/index.js';

test('numbers sort numerically, not lexicographically', () => {
  const out = naturalSort(['file10', 'file2', 'file1']);
  assert.deepEqual(out, ['file1', 'file2', 'file10']);
});

test('single values compare in numeric order', () => {
  assert.equal(naturalCompare('file2', 'file10') < 0, true);
  assert.equal(naturalCompare('file10', 'file2') > 0, true);
  assert.equal(naturalCompare('file2', 'file2'), 0);
});

test('leading zeros do not change numeric value', () => {
  // Equal numeric value: shorter run sorts first, so "file2" before "file02".
  assert.equal(naturalCompare('file02', 'file2') > 0, true);
  assert.equal(naturalCompare('file2', 'file02') < 0, true);
});

test('leading zeros preserved as tiebreakers between equal values', () => {
  // "02" and "2" represent the same number. "2" sorts first because the
  // longer equal-valued run sorts after the shorter one — a stable,
  // documented choice (see README), not an accident.
  const out = naturalSort(['a02', 'a2', 'a002', 'a20']);
  assert.deepEqual(out, ['a2', 'a02', 'a002', 'a20']);
});

test('plain string comparison when no digits are present', () => {
  const out = naturalSort(['banana', 'apple', 'cherry']);
  assert.deepEqual(out, ['apple', 'banana', 'cherry']);
});

test('case-insensitive primary, case-sensitive tiebreaker', () => {
  const out = naturalSort(['IMG12', 'img5', 'IMG5']);
  assert.deepEqual(out, ['img5', 'IMG5', 'IMG12']);
});

test('digit runs sort before letter runs at the same position', () => {
  assert.equal(naturalCompare('1a', 'a1') < 0, true);
});

test('long digit runs beyond safe integer still compare numerically', () => {
  const big = '9'.repeat(20);
  const bigger = '1' + '0'.repeat(20);
  assert.equal(naturalCompare('x' + big, 'x' + bigger) < 0, true);
  assert.equal(naturalCompare('x' + bigger, 'x' + big) > 0, true);
});

test('numeric tokens separated by non-digits compare segment by segment', () => {
  const out = naturalSort(['v1.10', 'v1.2', 'v1.1']);
  assert.deepEqual(out, ['v1.1', 'v1.2', 'v1.10']);
});

test('does not mutate the input array', () => {
  const input = ['file10', 'file2'];
  const snapshot = input.slice();
  naturalSort(input);
  assert.deepEqual(input, snapshot);
});

test('returns empty array for empty input', () => {
  assert.deepEqual(naturalSort([]), []);
});

test('sorts numbers coerced to strings', () => {
  const out = naturalSort([10, 2, 1]);
  assert.deepEqual(out, [1, 2, 10]);
});
