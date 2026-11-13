import { describe, it, expect } from 'vitest'
import { findCurrentIndex } from '../menuCurrent'

const items = ['AppleTV', 'KODI', 'TV', 'keine']

describe('findCurrentIndex', () => {
    it('returns -1 without a current value', () => {
        expect(findCurrentIndex(items, '', null)).toBe(-1)
        expect(findCurrentIndex(items, null, null)).toBe(-1)
        expect(findCurrentIndex(items, undefined, 'regExp')).toBe(-1)
        expect(findCurrentIndex(null, 'TV', null)).toBe(-1)
    })

    it('exact comparison', () => {
        expect(findCurrentIndex(items, 'TV', null)).toBe(2)
        expect(findCurrentIndex(items, ' TV ', null)).toBe(2)
        expect(findCurrentIndex(items, 'TV (HDMI1)', null)).toBe(-1)
        expect(findCurrentIndex(items, 'tv', null)).toBe(-1)
        expect(findCurrentIndex(['Radio_Bob'], 'Radio_Bob', null)).toBe(0)
    })

    it('regExp: current value contains the item value', () => {
        expect(findCurrentIndex(items, 'TV (HDMI1)', 'regExp')).toBe(2)
        expect(findCurrentIndex(items, 'kodi läuft', 'regExp')).toBe(1)
        expect(findCurrentIndex(items, 'Sendepause', 'regExp')).toBe(-1)
    })

    it('regExp: the longest matching item wins', () => {
        expect(findCurrentIndex(items, 'AppleTV (HDMI2)', 'regExp')).toBe(0)
        expect(findCurrentIndex(['TV', 'TV Kino'], 'TV Kino an', 'regExp')).toBe(1)
    })

    it('regExp: an exact match wins over a longer pattern match', () => {
        expect(findCurrentIndex(['TV', 'TV '], 'TV', 'regExp')).toBe(0)
        expect(findCurrentIndex(['TV', 'AppleTV'], 'TV', 'regExp')).toBe(0)
    })

    it('regExp: underscore and space are equal, special characters are literal', () => {
        expect(findCurrentIndex(['Radio_Bob'], 'Radio Bob', 'regExp')).toBe(0)
        expect(findCurrentIndex(['Radio Bob'], 'radio_bob', 'regExp')).toBe(0)
        expect(findCurrentIndex(['HDMI 1'], 'HDMI 2', 'regExp')).toBe(-1)
        expect(findCurrentIndex(['A+B (x)'], 'Szene A+B (x)', 'regExp')).toBe(0)
        expect(findCurrentIndex(['A+B (x)'], 'AAB x', 'regExp')).toBe(-1)
        expect(findCurrentIndex(['.*'], 'TV', 'regExp')).toBe(-1)
    })

    it('numbers as values', () => {
        expect(findCurrentIndex(['10', '20', '100'], 100, null)).toBe(2)
        expect(findCurrentIndex(['10', '20', '100'], '100 %', 'regExp')).toBe(2)
    })
})
