import { describe, expect, it } from 'vitest';
import { DEMO_PRODUCTS, compareConditions } from '../src/index.ts';
import type { MeasurementConditions } from '../src/index.ts';

const conditions: MeasurementConditions = {
  loadOhms: 8, channelsDriven: 2, bandwidthHz: [20, 20000],
  weighting: 'A', outputLevel: '1 W', method: 'fictional-demo-method',
};

describe('measurement condition comparison', () => {
  it('accepts equal conditions including separate but equal bandwidth tuples', () => {
    expect(compareConditions(conditions, { ...conditions, bandwidthHz: [20, 20000] })).toEqual({
      status: 'compatible', compatible: true, mismatches: [],
      shared: ['bandwidthHz', 'channelsDriven', 'loadOhms', 'method', 'outputLevel', 'weighting'],
    });
  });

  it.each<[keyof MeasurementConditions, MeasurementConditions]>([
    ['loadOhms', { loadOhms: 4 }], ['channelsDriven', { channelsDriven: 1 }],
    ['bandwidthHz', { bandwidthHz: [10, 20000] }], ['bandwidthHz', { bandwidthHz: [20, 22000] }],
    ['weighting', { weighting: 'unweighted' }], ['outputLevel', { outputLevel: '5 W' }],
    ['method', { method: 'other-fictional-method' }],
  ])('flags a different %s without normalizing or combining it', (key, change) => {
    const result = compareConditions(conditions, { ...conditions, ...change });
    expect(result.status).toBe('incompatible');
    expect(result.compatible).toBe(false);
    expect(result.mismatches).toEqual([key]);
    expect(result.shared).not.toContain(key);
  });

  it.each(Object.keys(conditions) as (keyof MeasurementConditions)[])('flags %s recorded on just one side symmetrically', key => {
    const oneSide = { [key]: conditions[key] };
    const expected = { status: 'incompatible', compatible: false, mismatches: [key], shared: [] };
    expect(compareConditions(oneSide, {})).toEqual(expected);
    expect(compareConditions({}, oneSide)).toEqual(expected);
  });

  it('ignores keys absent on both sides but never calls two unrecorded condition sets compatible', () => {
    expect(compareConditions({}, {})).toEqual({ status: 'undetermined', compatible: false, mismatches: [], shared: [] });
    expect(compareConditions({ loadOhms: 8 }, { loadOhms: 8 })).toEqual({
      status: 'compatible', compatible: true, mismatches: [], shared: ['loadOhms'],
    });
  });

  it('declares every demo product pair compatible (they share the documented demo assumption)', () => {
    for (const a of DEMO_PRODUCTS) {
      for (const b of DEMO_PRODUCTS) {
        expect(compareConditions(a.conditions, b.conditions).status).toBe('compatible');
      }
    }
    expect(DEMO_PRODUCTS[0]!.conditions.method).toBe('demo-assumed-identical');
  });

  it('sorts mismatches alphabetically regardless of key insertion order and does not mutate inputs', () => {
    const a = Object.freeze({ weighting: 'A', method: 'demo', loadOhms: 8, channelsDriven: 2, bandwidthHz: [20, 20000] as const });
    expect(compareConditions(a, {})).toEqual({
      status: 'incompatible', compatible: false, shared: [],
      mismatches: ['bandwidthHz', 'channelsDriven', 'loadOhms', 'method', 'weighting'],
    });
  });
});
