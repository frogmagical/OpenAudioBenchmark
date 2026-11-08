import { describe, expect, it } from 'vitest';
import { compareConditions } from '../src/index.ts';
import type { MeasurementConditions } from '../src/index.ts';

const conditions: MeasurementConditions = {
  loadOhms: 8, channelsDriven: 2, bandwidthHz: [20, 20000],
  weighting: 'A', outputLevel: '1 W', method: 'fictional-demo-method',
};

describe('measurement condition comparison', () => {
  it('accepts equal conditions including separate but equal bandwidth tuples', () => {
    expect(compareConditions(conditions, { ...conditions, bandwidthHz: [20, 20000] }))
      .toEqual({ compatible: true, mismatches: [] });
  });

  it.each<[keyof MeasurementConditions, MeasurementConditions]>([
    ['loadOhms', { loadOhms: 4 }], ['channelsDriven', { channelsDriven: 1 }],
    ['bandwidthHz', { bandwidthHz: [10, 20000] }], ['bandwidthHz', { bandwidthHz: [20, 22000] }],
    ['weighting', { weighting: 'unweighted' }], ['outputLevel', { outputLevel: '5 W' }],
    ['method', { method: 'other-fictional-method' }],
  ])('flags a different %s without normalizing or combining it', (key, change) => {
    expect(compareConditions(conditions, { ...conditions, ...change }))
      .toEqual({ compatible: false, mismatches: [key] });
  });

  it.each(Object.keys(conditions) as (keyof MeasurementConditions)[])('flags %s recorded on just one side symmetrically', key => {
    const oneSide = { [key]: conditions[key] };
    expect(compareConditions(oneSide, {})).toEqual({ compatible: false, mismatches: [key] });
    expect(compareConditions({}, oneSide)).toEqual({ compatible: false, mismatches: [key] });
  });

  it('ignores keys absent on both sides', () => {
    expect(compareConditions({}, {})).toEqual({ compatible: true, mismatches: [] });
    expect(compareConditions({ loadOhms: 8 }, { loadOhms: 8 })).toEqual({ compatible: true, mismatches: [] });
  });

  it('sorts mismatches alphabetically regardless of key insertion order and does not mutate inputs', () => {
    const a = Object.freeze({ weighting: 'A', method: 'demo', loadOhms: 8, channelsDriven: 2, bandwidthHz: [20, 20000] as const });
    expect(compareConditions(a, {})).toEqual({
      compatible: false, mismatches: ['bandwidthHz', 'channelsDriven', 'loadOhms', 'method', 'weighting'],
    });
  });
});
