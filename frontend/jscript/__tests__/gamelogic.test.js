// tests/gamelogic.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bitTest, bitSet, nextByRule, rnd, chooseRule, chooseGoal, chooseSeed, parse_comma_number_list, create_random_preset, test_win } from '../gamelogic.js';
import { gameState } from '../state.js';
describe('bitTest()', () => {
  it('should return non-zero if a bit is set', () => {
    // 0b1010 is decimal 10. Bits are [1,0,1,0] from LSB to MSB
    // So bitTest(10, 1) => checks the second bit. 10 in binary is ...1010
    // The bit positions: LSB=0 -> 0, bit=1 ->1, bit=2->0, bit=3->1
    // That means bit 1 is set, so expect non-zero
    const result = bitTest(10, 1);
    expect(result).not.toBe(0); // Should be non-zero
  });

  it('should return 0 if a bit is not set', () => {
    // Still 0b1010 is decimal 10
    // bitTest(10, 0) => LSB is bit 0 => that bit is 0 in 0b1010 => 0
    const result = bitTest(10, 0);
    expect(result).toBe(0);
  });

  it('should handle higher bits as well', () => {
    // 0b101000 = decimal 40. Bits are [0,0,1,0,1,0]
    // Checking bit 5 => should be set
    const result = bitTest(40, 5);
    expect(result).not.toBe(0);
  });
});

describe('bitSet()', () => {
  it('should set a bit that was previously 0', () => {
    // 0b1010 => decimal 10
    // set bit 0 => result should become 0b1011 => decimal 11
    const newValue = bitSet(10, 0);
    expect(newValue).toBe(11);
  });

  it('should leave the value unchanged if the bit is already set', () => {
    // 0b1011 => decimal 11
    // bit 1 is already set => bitSet(11, 1) => still 11
    const newValue = bitSet(11, 1);
    expect(newValue).toBe(11);
  });
});

describe('nextByRule()', () => {
  it('should compute the next state correctly for a simple rule', () => {
    const rule = 48; // in binary => 00110000 -> means bits 4 and 5 set => neighborhoods 4 & 5 => see below
    const newState = nextByRule(5, rule);
    expect(newState).toBeLessThan(8); // 3 bits => < 8
    expect(newState).toBe(2);
  });

  it('should return 0 if the rule does not set any bits', () => {
    // rule = 0 => no bits set => next state always 0
    const rule = 0;
    const currentState = 0b111; // decimal 7
    const nextState = nextByRule(currentState, rule);
    expect(nextState).toBe(0); // because no bits in the rule are set
  });

  it('should return full 0b111 if the rule sets all bits', () => {
    // rule = 255 => binary 11111111 => sets any neighborhood
    // next state always ends up 0b111 => decimal 7
    const rule = 255;
    const currentState = 0;
    const nextState = nextByRule(currentState, rule);
    expect(nextState).toBe(7); // 0b111
  });
});

describe('rnd(N)', () => {
  it('returns an integer in [0, N)', () => {
    const N = 10;
    for (let i = 0; i < 50; i++) {
      const result = rnd(N);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(N);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it('handles N=1 by always returning 0', () => {
    for (let i = 0; i < 10; i++) {
      expect(rnd(1)).toBe(0);
    }
  });

  it('can mock Math.random for a predictable result', () => {
    // Suppose we want to confirm rnd(N) is exactly Math.floor(Math.random()*N).
    // We'll mock Math.random to always return 0.9999
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    const val = rnd(10); // => floor(0.9999*10) = 9
    expect(val).toBe(9);
    spy.mockRestore(); // restore original Math.random
  });
});

describe('chooseRule()', () => {
  it('returns a number in [0..255]', () => {
    for (let i = 0; i < 50; i++) {
      const rule = chooseRule();
      expect(rule).toBeGreaterThanOrEqual(0);
      expect(rule).toBeLessThanOrEqual(255);
      expect(Number.isInteger(rule)).toBe(true);
    }
  });

  it('can mock Math.random to produce an exact rule', () => {
    // If you want to ensure a certain 'rule' is returned, you can mock.
    // For example, want 256 * 0.5 = 128 => the midpoint.
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(chooseRule()).toBe(128);
    spy.mockRestore();
  });
});

describe('chooseGoal()', () => {
  it('returns a number in [0..7]', () => {
    for (let i = 0; i < 30; i++) {
      const goal = chooseGoal();
      expect(goal).toBeGreaterThanOrEqual(0);
      expect(goal).toBeLessThanOrEqual(7);
      expect(Number.isInteger(goal)).toBe(true);
    }
  });
});

describe('chooseSeed()', () => {
  it('returns a number in [1..6]', () => {
    for (let i = 0; i < 30; i++) {
      const seed = chooseSeed();
      expect(seed).toBeGreaterThanOrEqual(1);
      expect(seed).toBeLessThanOrEqual(6);
      expect(Number.isInteger(seed)).toBe(true);
    }
  });

  it('can mock Math.random to ensure it never returns 0 or 7', () => {
    // E.g. if we mock random = 0.0 => chooseSeed => 1
    // if we mock random = 0.99 => chooseSeed => 6
    let spy = vi.spyOn(Math, 'random').mockReturnValue(0.0);
    expect(chooseSeed()).toBe(1);
    spy.mockRestore();

    spy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(chooseSeed()).toBe(6);
    spy.mockRestore();
  });
});

describe('parse_comma_number_list()', () => {

  it('should parse a simple comma-separated list of digits', () => {
    const input = '1,2,3';
    const result = parse_comma_number_list(input);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should parse numbers with extra spaces', () => {
    const input = ' 10,  20 ,30 ';
    const result = parse_comma_number_list(input);
    expect(result).toEqual([10, 20, 30]);
  });

  it('should parse a single value (no commas)', () => {
    const input = '42';
    const result = parse_comma_number_list(input);
    expect(result).toEqual([42]);
  });

  it('should parse zeros correctly', () => {
    const input = '0, 0, 123';
    const result = parse_comma_number_list(input);
    expect(result).toEqual([0, 0, 123]);
  });

  it('should handle an empty string', () => {
    const input = '';
    expect(() => parse_comma_number_list(input)).toThrow();
  });

  it('should ignore non-digit characters in each split part', () => {
    const input = 'abc123, 456def, 78!@#';
    const result = parse_comma_number_list(input);
    // For each comma-delimited substring, the regex /\d+/ picks out digits only:
    // 'abc123' => '123'
    // ' 456def' => '456'
    // ' 78!@#' => '78'
    // So the result should be [123, 456, 78]
    expect(result).toEqual([123, 456, 78]);
  });

});

describe('create_random_preset()', () => {
  it('should return a preset object with the correct shape', () => {
    const preset = create_random_preset();
    expect(preset).toBeDefined();

    // Check the top-level properties
    expect(preset).toHaveProperty('rows', 8);
    expect(preset).toHaveProperty('columns', 8);
    expect(preset).toHaveProperty('seeds');
    expect(preset).toHaveProperty('rules');
    expect(preset).toHaveProperty('goals');
    expect(preset).toHaveProperty('swap_enabled', false);
    expect(preset).toHaveProperty('show_rows_ahead', false);
    expect(preset).toHaveProperty('name', 'Random Game');
    expect(preset).toHaveProperty('desc', '');
  });

  it('should generate 8 seed values between 1 and 6 (inclusive)', () => {
    const preset = create_random_preset();
    expect(Array.isArray(preset.seeds)).toBe(true);
    expect(preset.seeds.length).toBe(8);
    preset.seeds.forEach((seed) => {
      expect(seed).toBeGreaterThanOrEqual(1);
      expect(seed).toBeLessThanOrEqual(6);
    });
  });

  it('should generate 8 rule values in [0..255]', () => {
    const preset = create_random_preset();
    expect(Array.isArray(preset.rules)).toBe(true);
    expect(preset.rules.length).toBe(8);
    preset.rules.forEach((rule) => {
      expect(rule).toBeGreaterThanOrEqual(0);
      expect(rule).toBeLessThanOrEqual(255);
    });
  });

  it('should generate 8 goal values in [0..7]', () => {
    const preset = create_random_preset();
    expect(Array.isArray(preset.goals)).toBe(true);
    expect(preset.goals.length).toBe(8);
    preset.goals.forEach((goal) => {
      expect(goal).toBeGreaterThanOrEqual(0);
      expect(goal).toBeLessThanOrEqual(7);
    });
  });

  it('should produce consistent outputs if Math.random is mocked', () => {
    // Suppose you want a reproducible test to ensure seeds, rules, etc. match expected values
    // if Math.random always returns a constant. We'll do a quick mock and then restore it.

    const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.0);
    // With 0.0, the calculations become predictable:
    //  - seeds => always Math.floor(0*6)+1 = 1
    //  - rules => always Math.floor(0*256) = 0
    //  - goals => always Math.floor(0*8) = 0
    const preset = create_random_preset();

    expect(preset.seeds).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(preset.rules).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(preset.goals).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);

    mockRandom.mockRestore();
  });
});

describe('test_win()', () => {
  beforeEach(() => {
    // Optionally, reset or stub out relevant parts of gameState before each test
    gameState.GOALS = [];
    gameState.CA_STATE_MATRIX = [];
  });

  it('should return true when CA_STATE_MATRIX matches GOALS for every row', () => {
    // Suppose we have 3 rows
    gameState.GOALS = [1, 2, 3];
    // The last element of each row in CA_STATE_MATRIX should match the corresponding goal.
    gameState.CA_STATE_MATRIX = [
      [0, 1],   // row 0 ends in 1
      [5, 2],   // row 1 ends in 2
      [7, 3],   // row 2 ends in 3
    ];

    const result = test_win();
    expect(result).toBe(true);
  });

  it('should return false if at least one row’s final state does not match its goal', () => {
    // Suppose we have 3 rows again
    gameState.GOALS = [1, 2, 3];
    gameState.CA_STATE_MATRIX = [
      [0, 1],  // row 0 ends in 1
      [5, 2],  // row 1 ends in 2
      [7, 9],  // row 2 ends in 9 <-- mismatch!
    ];

    const result = test_win();
    expect(result).toBe(false);
  });

  it('should handle an empty goals array or matrix gracefully (likely return true)', () => {
    // Edge case: no goals => trivially "won" or depends on your logic
    gameState.GOALS = [];
    gameState.CA_STATE_MATRIX = [];
    // Currently, test_win() loops over `i < gameState.GOALS.length`, so an empty array won’t fail the loop
    // The function will just return true. This might be the expected or default behavior.
    expect(test_win()).toBe(true);
  });
});
