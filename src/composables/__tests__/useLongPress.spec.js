import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { useLongPress, LONG_PRESS_MS } from '../useLongPress'

const down = (x = 0, y = 0, extra = {}) => ({ pointerType: 'touch', button: 0, clientX: x, clientY: y, ...extra })

describe('useLongPress', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('fires after the long press duration and end() reports it', () => {
        const lp = useLongPress()
        const fn = vi.fn()

        lp.start(1, down(), fn)
        expect(lp.pressed.value).toBe(1)

        vi.advanceTimersByTime(LONG_PRESS_MS - 1)
        expect(fn).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(lp.pressed.value).toBe(null)
        expect(lp.end()).toBe(true)
    })

    it('a short press does not fire and end() returns false', () => {
        const lp = useLongPress()
        const fn = vi.fn()

        lp.start(1, down(), fn)
        vi.advanceTimersByTime(300)

        expect(lp.end()).toBe(false)
        vi.advanceTimersByTime(LONG_PRESS_MS)
        expect(fn).not.toHaveBeenCalled()
        expect(lp.pressed.value).toBe(null)
    })

    it('moving beyond the tolerance cancels (scrolling)', () => {
        const lp = useLongPress()
        const fn = vi.fn()

        lp.start(1, down(100, 100), fn)
        lp.move({ clientX: 105, clientY: 105 })
        vi.advanceTimersByTime(500)
        lp.move({ clientX: 100, clientY: 130 })
        vi.advanceTimersByTime(LONG_PRESS_MS)

        expect(fn).not.toHaveBeenCalled()
        expect(lp.end()).toBe(false)
    })

    it('cancel() stops a running press', () => {
        const lp = useLongPress()
        const fn = vi.fn()

        lp.start(1, down(), fn)
        lp.cancel()
        vi.advanceTimersByTime(LONG_PRESS_MS)

        expect(fn).not.toHaveBeenCalled()
    })

    it('ignores non-primary mouse buttons', () => {
        const lp = useLongPress()
        const fn = vi.fn()

        lp.start(1, down(0, 0, { pointerType: 'mouse', button: 2 }), fn)
        vi.advanceTimersByTime(LONG_PRESS_MS)

        expect(fn).not.toHaveBeenCalled()
        expect(lp.pressed.value).toBe(null)
    })

    it('a new press on another key replaces the running one', () => {
        const lp = useLongPress()
        const first = vi.fn(), second = vi.fn()

        lp.start(1, down(), first)
        vi.advanceTimersByTime(500)
        lp.start(2, down(), second)
        expect(lp.pressed.value).toBe(2)

        vi.advanceTimersByTime(LONG_PRESS_MS)
        expect(first).not.toHaveBeenCalled()
        expect(second).toHaveBeenCalledTimes(1)
    })

    it('respects a custom duration', () => {
        const lp = useLongPress({ duration: 200 })
        const fn = vi.fn()

        lp.start(1, down(), fn)
        vi.advanceTimersByTime(200)

        expect(fn).toHaveBeenCalledTimes(1)
    })
})
