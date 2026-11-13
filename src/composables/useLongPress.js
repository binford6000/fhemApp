import { ref, onBeforeUnmount, getCurrentInstance } from 'vue'

export const LONG_PRESS_MS = 1000
export const MOVE_TOLERANCE_PX = 10

// Long press detection based on Pointer Events (mouse, touch and pen in one API,
// no emulated mouse events after touch). Several targets can share one instance,
// they are told apart by a key (e.g. the index of a menu item).
//
// usage:
//   const lp = useLongPress()
//   @pointerdown="lp.start(key, $event, () => doSomething())"
//   @pointermove="lp.move($event)"
//   @pointerup="lp.end() || showHint()"   // end() returns true if the long press fired
//   @pointercancel / @pointerleave="lp.cancel()"
//
// lp.pressed holds the key of the target that is currently held down (for a progress indicator).
export function useLongPress(options = {}) {
    const duration = options.duration ?? LONG_PRESS_MS
    const tolerance = options.tolerance ?? MOVE_TOLERANCE_PX
    const pressed = ref(null)

    let timer = null,
        fired = false,
        startX = 0,
        startY = 0

    function start(key, evt, onLong) {
        if(evt && evt.pointerType === 'mouse' && evt.button !== 0) return

        cancel()
        fired = false
        startX = evt ? evt.clientX : 0
        startY = evt ? evt.clientY : 0
        pressed.value = key

        timer = setTimeout(() => {
            timer = null
            fired = true
            pressed.value = null
            onLong()
        }, duration)
    }

    function move(evt) {
        if(!timer || !evt) return
        if(Math.abs(evt.clientX - startX) > tolerance || Math.abs(evt.clientY - startY) > tolerance) cancel()
    }

    // returns true if the long press action was executed for this press
    function end() {
        const res = fired

        cancel()
        fired = false

        return res
    }

    function cancel() {
        if(timer) clearTimeout(timer)
        timer = null
        pressed.value = null
    }

    if(getCurrentInstance()) onBeforeUnmount(cancel)

    return { pressed, duration, start, move, end, cancel }
}
