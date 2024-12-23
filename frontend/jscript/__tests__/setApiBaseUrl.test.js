// jscript/__tests__/setApiBaseUrl.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setApiBaseUrl, API_BASE_URL } from '../win.js'

describe('setApiBaseUrl', () => {
  const originalLocation = window.location

  beforeEach(() => {
    // We’ll redefine `window.location` in each test
    // (JSDOM may complain if we just assign to window.location)
    delete window.location
    window.location = {
      hostname: 'localhost',
      protocol: 'http:',
    } 
  })

  afterEach(() => {
    // Restore the real window.location
    window.location = originalLocation
  })

  it('sets API_BASE_URL to localhost:8000 in local dev environment', () => {
    // Arrange
    window.location.hostname = 'localhost'

    // Act
    setApiBaseUrl()

    // Assert
    expect(API_BASE_URL).toBe('http://localhost:8000')
  })

  it('sets API_BASE_URL to production URL if not localhost/127.0.0.1', () => {
    // Arrange
    window.location.hostname = 'example.com'
    window.location.protocol = 'https:'

    // Act
    setApiBaseUrl()

    // Assert
    expect(API_BASE_URL).toBe('https://api.chromaxen.com')
  })
})
