import { describe, expect, it } from 'vitest'
import { lamportsToSol, solToLamports } from './aidex'

describe('SOL amount conversion', () => {
  it('converts exact fractional SOL to integer lamports', () => {
    expect(solToLamports('12.345678901')).toBe(12_345_678_901n)
  })

  it('formats lamports without floating point rounding', () => {
    expect(lamportsToSol(12_345_678_901n)).toBe('12.345678901')
    expect(lamportsToSol('1000000000')).toBe('1')
  })

  it('rejects negative, malformed, and over-precise values', () => {
    for (const value of ['-1', '1e3', '1.0000000001', '']) {
      expect(() => solToLamports(value)).toThrow()
    }
  })
})
