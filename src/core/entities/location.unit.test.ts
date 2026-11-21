import assert from 'node:assert';
import { test } from 'node:test';
import { getLocationCells, locationCellToTravelCommand, locationToTravelCommand } from './location.ts';

test('getLocationCells', async (t) => {
  await t.test('should return an empty array for undefined cell', () => {
    assert.deepStrictEqual(getLocationCells(undefined), []);
  });

  await t.test('should wrap a single cell into an array', () => {
    assert.deepStrictEqual(getLocationCells('10 -5'), ['10 -5']);
  });

  await t.test('should return the same array for multiple cells', () => {
    assert.deepStrictEqual(getLocationCells(['10 -5', '11 -4']), ['10 -5', '11 -4']);
  });
});

test('locationCellToTravelCommand', async (t) => {
  await t.test('should build a coe command from a cell', () => {
    assert.strictEqual(locationCellToTravelCommand('10 -5'), 'coe 10 -5');
  });
});

test('locationToTravelCommand', async (t) => {
  await t.test('should build a coe command from the center of cells', () => {
    assert.strictEqual(locationToTravelCommand({ title: 'Somewhere', cell: '10 -5' }), 'coe 10 -5');
    assert.strictEqual(locationToTravelCommand({ title: 'Somewhere', cell: ['0 0', '10 10'] }), 'coe 5 5');
  });

  await t.test('should build a coc command for a location without cells', () => {
    assert.strictEqual(locationToTravelCommand({ title: 'Balmora' }), 'coc "Balmora"');
  });
});
