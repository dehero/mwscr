import assert from 'node:assert';
import { test } from 'node:test';
import { findWorldMapLocationInfo, type LocationInfo } from './location-info.ts';

const infos: LocationInfo[] = [
  { title: 'Balmora', type: 'exterior', cell: '10 10' },
  { title: 'Balmora, Guild of Mages', type: 'interior' },
  { title: 'Vivec', type: 'exterior', cell: ['20 20', '21 21'] },
  { title: 'Vivec, Redoran', type: 'exterior', cell: '22 22' },
  { title: 'Vivec, Redoran, Manor', type: 'interior' },
  { title: 'Sadrith Mora', type: 'region' },
];

test('findWorldMapLocationInfo', async (t) => {
  await t.test('should return the same info when it has a cell', () => {
    assert.strictEqual(findWorldMapLocationInfo(infos, 'Vivec')?.title, 'Vivec');
  });

  await t.test('should find a nested location that has a cell', () => {
    assert.strictEqual(findWorldMapLocationInfo(infos, 'Balmora, Guild of Mages')?.title, 'Balmora');
  });

  await t.test('should prefer the most specific nested location', () => {
    assert.strictEqual(findWorldMapLocationInfo(infos, 'Vivec, Redoran, Manor')?.title, 'Vivec, Redoran');
  });

  await t.test('should return undefined when nothing matches', () => {
    assert.strictEqual(findWorldMapLocationInfo(infos, 'Nowhere'), undefined);
  });

  await t.test('should return undefined when no nested location has a cell', () => {
    assert.strictEqual(findWorldMapLocationInfo(infos, 'Sadrith Mora'), undefined);
  });

  await t.test('should accept an array of titles', () => {
    assert.strictEqual(findWorldMapLocationInfo(infos, ['Nowhere', 'Balmora'])?.title, 'Balmora');
  });
});
