// tests/gamelogic.test.js

import { describe, it, expect } from 'vitest';
import { bitTest, bitSet, nextByRule } from '../gamelogic.js';

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
