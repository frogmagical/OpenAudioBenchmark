import { describe, expect, it } from 'vitest';
import {
  availablePowerForLoad, classifyHeadroom, DEFAULT_PAIRING_INPUT, DEMO_AMPS, DEMO_SPEAKERS,
  evaluatePairing, headroomDb, requiredPowerW, sensitivityAt1W, validatePairingInput,
} from '../src/index.ts';
import type { PairingInput, PairingVerdict, SensitivitySpec } from '../src/index.ts';

const amp = DEMO_AMPS[0]!;
const speaker = DEMO_SPEAKERS[0]!;

describe('sensitivity reference conversion', () => {
  it.each([[4, 81.9897000434], [8, 85], [16, 88.0102999566]])(
    'converts 85 dB @ 2.83V/1m into %s ohms to %s dB @ 1W/1m', (ohms, expected) => {
      expect(sensitivityAt1W({ valueDb: 85, reference: '2.83V/1m' }, ohms)).toBeCloseTo(expected, 8);
    },
  );

  it.each([4, 8, 16])('preserves a 1W/1m sensitivity into %s ohms', ohms => {
    expect(sensitivityAt1W({ valueDb: 85, reference: '1W/1m' }, ohms)).toBe(85);
  });

  it.each([0, -4, NaN, Infinity, -Infinity])('rejects invalid load %s for either reference', ohms => {
    for (const reference of ['1W/1m', '2.83V/1m'] as const) {
      expect(() => sensitivityAt1W({ valueDb: 85, reference }, ohms)).toThrow(RangeError);
    }
  });
});

describe('power and headroom', () => {
  it('requires 1 W to reproduce the sensitivity SPL at 1 m with no corrections', () => {
    expect(requiredPowerW(85, { distanceM: 1, targetPeakSpl: 85, safetyMarginDb: 0, stereoGainDb: 0 })).toBe(1);
  });

  it('doubling distance requires four times the power; +10 dB requires ten times', () => {
    const input = { distanceM: 1, targetPeakSpl: 85, safetyMarginDb: 0, stereoGainDb: 0 };
    expect(requiredPowerW(85, { ...input, distanceM: 2 })).toBeCloseTo(4, 10);
    expect(requiredPowerW(85, { ...input, targetPeakSpl: 95 })).toBeCloseTo(10, 10);
    expect(requiredPowerW(85, { ...input, safetyMarginDb: 3 })).toBeCloseTo(10 ** 0.3, 10);
    expect(requiredPowerW(85, { ...input, stereoGainDb: 3 })).toBeCloseTo(10 ** -0.3, 10);
  });

  it('selects only the exact published load, with no interpolation', () => {
    expect(availablePowerForLoad(amp, 8)).toBe(85);
    expect(availablePowerForLoad(amp, 4)).toBe(150);
    for (const load of [2, 6, 16, NaN, Infinity]) expect(availablePowerForLoad(amp, load)).toBeNull();
  });

  it.each([null, 0, -1, NaN, Infinity, -Infinity])('treats invalid/unpublished output %s as unknown', power => {
    const invalid = { ...amp, powerAt8Ohms: power, powerAt4Ohms: power };
    expect(availablePowerForLoad(invalid, 8)).toBeNull();
    expect(availablePowerForLoad(invalid, 4)).toBeNull();
  });

  it('uses the power ratio in dB and propagates unknown power', () => {
    expect(headroomDb(10, 1)).toBe(10);
    expect(headroomDb(1, 10)).toBe(-10);
    expect(headroomDb(10, 10)).toBe(0);
    expect(headroomDb(null, 10)).toBeNull();
  });

  it.each([0, -1, NaN, Infinity, -Infinity])('returns unknown headroom for invalid operand %s, never NaN', value => {
    expect(headroomDb(value, 10)).toBeNull();
    expect(headroomDb(10, value)).toBeNull();
  });

  it.each<[number | null, PairingVerdict]>([
    [3, 'positive'], [2.999, 'neutral'], [0, 'neutral'], [-0.001, 'negative'], [null, 'pending'],
  ])('classifies %s dB as %s', (value, verdict) => {
    // The 3 dB / 0 dB boundaries are pinned on literal inputs on purpose: through headroomDb,
    // available = required·10^0.3 yields 2.999999999999999 dB (prototype arithmetic is identical). Do not add an epsilon.
    expect(classifyHeadroom(value)).toBe(verdict);
  });
});

describe('pairing validation and evaluation', () => {
  it.each<[keyof PairingInput, number, string]>([
    ['distanceM', 0.4, 'distance-out-of-range'], ['distanceM', 8.5, 'distance-out-of-range'],
    ['distanceM', NaN, 'distance-invalid'], ['distanceM', Infinity, 'distance-invalid'],
    ['targetPeakSpl', 59, 'peak-out-of-range'], ['targetPeakSpl', 116, 'peak-out-of-range'],
    ['targetPeakSpl', NaN, 'peak-invalid'], ['targetPeakSpl', Infinity, 'peak-invalid'],
    ['stereoGainDb', NaN, 'stereo-gain-invalid'], ['stereoGainDb', Infinity, 'stereo-gain-invalid'],
    ['safetyMarginDb', NaN, 'safety-margin-invalid'], ['safetyMarginDb', Infinity, 'safety-margin-invalid'],
  ])('rejects %s = %s with %s', (key, value, code) => {
    const input = { ...DEFAULT_PAIRING_INPUT, [key]: value };
    expect(validatePairingInput(input)).toEqual([code]);
    expect(evaluatePairing(amp, speaker, input)).toEqual({ ok: false, error: 'invalid-input', problems: [code] });
  });

  it.each([0, -8, NaN, Infinity])('rejects a speaker whose nominal load is %s instead of throwing', ohms => {
    expect(evaluatePairing(amp, { ...speaker, nominalOhms: ohms }, DEFAULT_PAIRING_INPUT)).toEqual({
      ok: false, error: 'invalid-input', problems: ['speaker-load-invalid'],
    });
  });

  it('reports all invalid fields together', () => {
    expect(validatePairingInput({ distanceM: 0, targetPeakSpl: NaN, stereoGainDb: Infinity, safetyMarginDb: NaN }))
      .toEqual(['distance-out-of-range', 'peak-invalid', 'stereo-gain-invalid', 'safety-margin-invalid']);
  });

  it.each([[0.5, 60], [0.5, 115], [8, 60], [8, 115]])('accepts inclusive endpoints %s m / %s dB', (distanceM, targetPeakSpl) => {
    const input = { ...DEFAULT_PAIRING_INPUT, distanceM, targetPeakSpl };
    expect(validatePairingInput(input)).toEqual([]);
    expect(evaluatePairing(amp, speaker, input).ok).toBe(true);
  });

  it('matches Reference Amp A + Monitor Speaker M: 22.5 W, +5.77 dB, positive', () => {
    const input = { ...DEFAULT_PAIRING_INPUT, distanceM: 1.5 };
    const result = evaluatePairing(amp, speaker, input);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected a valid reference pairing');
    expect(result.requiredPowerW).toBeCloseTo(22.5, 10);
    expect(result.headroomDb).toBeCloseTo(5.7724, 3);
    expect(result).toMatchObject({
      sensitivityAt1WDb: 85, availablePowerW: 85, outputVerdict: 'positive',
      loadVerdict: 'pending', bandVerdict: 'pending', ampId: 'a', speakerId: 's1',
      inputs: DEFAULT_PAIRING_INPUT, methodologyVersion: '0.4.0-demo',
    });
    input.distanceM = 2;
    expect(result.inputs.distanceM).toBe(1.5);
  });

  it('keeps Compact Amp E + Demanding Speaker D pending for unknown 4-ohm output', () => {
    const compact = DEMO_AMPS.find(a => a.id === 'e')!;
    const demanding = DEMO_SPEAKERS.find(s => s.id === 's3')!;
    expect(evaluatePairing(compact, demanding, DEFAULT_PAIRING_INPUT)).toMatchObject({
      ok: true, availablePowerW: null, headroomDb: null, outputVerdict: 'pending',
      loadVerdict: 'pending', bandVerdict: 'pending', methodologyVersion: '0.4.0-demo',
    });
  });

  it('uses voltage sensitivity conversion inside the full pairing evaluation', () => {
    const sensitivity: SensitivitySpec = { valueDb: 85, reference: '2.83V/1m' };
    const result = evaluatePairing(amp, { ...speaker, nominalOhms: 4, sensitivity }, DEFAULT_PAIRING_INPUT);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected a valid voltage sensitivity pairing');
    expect(result.sensitivityAt1WDb).toBeCloseTo(81.9897, 4);
    expect(result.requiredPowerW).toBeCloseTo(45, 8);
    expect(result.availablePowerW).toBe(150);
  });

  it('does not infer amplifier power at an unsupported nominal load', () => {
    expect(evaluatePairing(amp, { ...speaker, nominalOhms: 16 }, DEFAULT_PAIRING_INPUT)).toMatchObject({
      ok: true, availablePowerW: null, headroomDb: null, outputVerdict: 'pending',
    });
  });

  it('never promotes load or band verdicts even with known minimum impedance; versions every success', () => {
    for (const a of DEMO_AMPS) {
      for (const s of DEMO_SPEAKERS) {
        expect(evaluatePairing(a, s, DEFAULT_PAIRING_INPUT)).toMatchObject({
          ok: true, loadVerdict: 'pending', bandVerdict: 'pending', methodologyVersion: '0.4.0-demo',
        });
      }
    }
  });
});
