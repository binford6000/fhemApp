// Finds the menu item that matches the current value (element menu, property current).
//
// values:  raw values of the menu items (before '_' is replaced by a space)
// current: current value, e.g. from scene-state::%s
// convert: '' (exact comparison) or 'regExp' (pattern comparison)
//
// exact:  the item value must be equal to the current value (whitespace at the ends is ignored)
// regExp: an exact match still wins. Otherwise an item matches if the current value contains
//         the item value, case-insensitive; '_' and spaces are treated as equal, all other
//         characters are compared literally. If several items match, the longest one wins,
//         e.g. current 'AppleTV (HDMI2)' -> 'AppleTV' instead of 'TV'.
//
// returns the index of the matching item or -1
export function findCurrentIndex(values, current, convert) {
    if(!Array.isArray(values) || current === null || current === undefined) return -1

    const cur = String(current).trim()

    if(cur === '') return -1

    const exact = values.findIndex((val) => String(val).trim() === cur)

    if(exact !== -1 || convert !== 'regExp') return exact

    let best = -1,
        bestLen = 0

    for(const [idx, val] of values.entries()) {
        const item = String(val).trim()

        if(!item || item.length <= bestLen) continue

        const pattern = item
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/[_\s]+/g, '[_\\s]+')

        if(RegExp(pattern, 'i').test(cur)) {
            best = idx
            bestLen = item.length
        }
    }

    return best
}
