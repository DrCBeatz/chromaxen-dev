// frontend/jscript/__tests__/presets.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getFirstChildByTagName, loadPresets } from '../presets.js'

describe('presets.js', () => {
  describe('getFirstChildByTagName', () => {
    it('returns the first child element with the given tag name', () => {
      const parent = document.createElement('div')
      const child1 = document.createElement('span')
      const child2 = document.createElement('SPAN') // Same tagName but uppercase
      const child3 = document.createElement('p')

      parent.appendChild(child1)
      parent.appendChild(child2)
      parent.appendChild(child3)

      // The function checks for exact tagName match. In HTML DOM, tagName is usually uppercase.
      expect(getFirstChildByTagName(parent, 'SPAN')).toBe(child1)
    })

    it('returns undefined if no matching child is found', () => {
      const parent = document.createElement('div')
      const child = document.createElement('span')
      parent.appendChild(child)

      // No child with tagName 'P'
      expect(getFirstChildByTagName(parent, 'P')).toBeUndefined()
    })

    it('returns the first of multiple matching children', () => {
        const parent = document.createElement('div')
        const firstSpan = document.createElement('span')
        const secondSpan = document.createElement('span')
        parent.appendChild(firstSpan)
        parent.appendChild(secondSpan)
      
        expect(getFirstChildByTagName(parent, 'SPAN')).toBe(firstSpan)
      })
      
      it('returns undefined if parent has no children', () => {
        const parent = document.createElement('div')
        expect(getFirstChildByTagName(parent, 'SPAN')).toBeUndefined()
      })
      
  })

  describe('loadPresets', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('loads and parses a valid XML file and calls the callback', async () => {
      const mockXML = `<root><item>Test</item></root>`
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockXML),
        })
      )
      global.fetch = mockFetch

      const callback = vi.fn()
      loadPresets('/fake.xml', callback)

      // Wait for the promise to resolve
      await new Promise(setImmediate)

      expect(mockFetch).toHaveBeenCalledWith('/fake.xml', { cache: 'no-store' })
      expect(callback).toHaveBeenCalledTimes(1)
      
      const docArg = callback.mock.calls[0][0]
      expect(docArg).toBeInstanceOf(Document)
      expect(docArg.getElementsByTagName('item')[0].textContent).toBe('Test')
    })

    it('throws an error if the response is not ok', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Not Found',
        })
      )
      global.fetch = mockFetch
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const callback = vi.fn()
      loadPresets('/missing.xml', callback)

      await new Promise(setImmediate)

      expect(mockFetch).toHaveBeenCalled()
      expect(callback).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading presets:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it('throws an error if the XML is invalid', async () => {
      const invalidXML = `<root><item></root>` // Unclosed <item> tag
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(invalidXML),
        })
      )
      global.fetch = mockFetch
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const callback = vi.fn()
      loadPresets('/invalid.xml', callback)

      await new Promise(setImmediate)

      expect(mockFetch).toHaveBeenCalled()
      expect(callback).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading presets:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it('handles empty XML responses', async () => {
        const mockFetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(''),
          })
        )
        global.fetch = mockFetch
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
        const callback = vi.fn()
        loadPresets('/empty.xml', callback)
      
        await new Promise(setImmediate)
      
        expect(mockFetch).toHaveBeenCalled()
        expect(callback).not.toHaveBeenCalled()
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading presets:', expect.any(Error))
      
        consoleErrorSpy.mockRestore()
      })
      
      it('handles fetch rejection (e.g. network error)', async () => {
        const mockFetch = vi.fn(() => Promise.reject(new Error('Network failure')))
        global.fetch = mockFetch
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
        const callback = vi.fn()
        loadPresets('/network-error.xml', callback)
      
        await new Promise(setImmediate)
      
        expect(mockFetch).toHaveBeenCalled()
        expect(callback).not.toHaveBeenCalled()
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading presets:', expect.any(Error))
      
        consoleErrorSpy.mockRestore()
      })
      
      it('handles missing callback gracefully', async () => {
        const mockXML = `<root><item>Test</item></root>`
        const mockFetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockXML),
          })
        )
        global.fetch = mockFetch
      
        // Call with no callback
        loadPresets('/fake.xml')
      
        await new Promise(setImmediate)
      
        expect(mockFetch).toHaveBeenCalled()
        // No callback to test for, but ensure no errors occurred
      })
      
  })
})
