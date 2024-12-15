import { describe, it, expect } from 'vitest'
import { dereference } from '../utility.js'

describe('dereference', () => {
    it('should return a new array that has the same elements as the original array', () => {
        const original = [1, 2, 3]
        const result = dereference(original)

        expect(result).toEqual(original)   // Check if it has the same elements
        expect(result).not.toBe(original)  // Check if it is not the same reference
    })

    it('should handle empty arrays', () => {
        const original = []
        const result = dereference(original)

        expect(result).toEqual([])
        expect(result).not.toBe(original)
    })

    it('should copy references to objects without modifying the original', () => {
        const obj = { a: 1 }
        const original = [obj, 2, 'test']
        const result = dereference(original)

        // It should have identical contents
        expect(result).toEqual(original)

        // Not the same reference
        expect(result).not.toBe(original)

        // The object inside should be the same reference, since it's shallow copy
        expect(result[0]).toBe(obj)
    })
})
