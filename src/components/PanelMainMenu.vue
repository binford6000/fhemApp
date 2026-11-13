<script setup>
    import { computed, watch, ref } from 'vue'
    import { useFhemStore } from '@/stores/fhem'
    import { useLongPress } from '@/composables/useLongPress'

    const props = defineProps({
        el: Object,
        iconmap: Array,
        devices: Array,
        height: String
    })

    const fhem = useFhemStore()

    const menuItems = ref([])

    const open = ref(false)

    const hintIdx = ref(null)

    const lp = useLongPress()

    const lpPressed = lp.pressed

    let hintTimer = null

    watch(props.el, (newVal) => {
        loadMenu(newVal)
    })

    const btn = computed(() => {
        let res = fhem.handleDefs(props.el.btn, ['icon', 'disabled', 'color', 'variant'], ['mdi-dots-vertical', false, '', 'text'])

        if(res.icon) res.icon = fhem.getIcon(res.icon, props.iconmap)

        return res
    })

    // current value of the menu, used to highlight the matching menu item
    const current = computed(() => {
        return fhem.handleDefs(props.el.current, ['current', 'color'], ['', 'primary'])
    })

    const hasCurrent = computed(() => {
        return current.value.current !== null && current.value.current !== undefined && String(current.value.current) !== ''
    })

    function isCurrent(item) {
        if(!hasCurrent.value) return false

        return String(item.val).trim() === String(current.value.current).trim()
    }

    async function loadMenu() {
        let defs = fhem.handleDefs(props.el.menu, ['name', 'cmd', 'convert', 'long'], ['','', null, false], true, ','),
            vals,
            divider,
            re

        menuItems.value = []

        for(const def of defs) {
            vals = /^get/.test(def.name) ? await doCmd(def.name) : def.name

            for(const el of [',','|','\n']) if(RegExp(el).test(vals)) divider = el

            for(const val of vals.split(divider)) {
                if(val) {
                    re = val

                    if(/%v/.test(def.cmd) && def.convert === 'regExp') re = RegExp(val.replace(/[^a-z,^A-Z]/g, '.'))

                    menuItems.value.push({ name: val.replace('_', ' '), val, cmd: def.cmd.replace(/%v/g, re), long: def.long === true })
                }
            }
        }
    }

    async function doCmd(cmd) {
        let cmdList = []

        cmdList = cmd.split(';')

        for(const [idx] of Object.entries(cmdList)) {
            for(const device of props.devices) cmdList[idx] = cmdList[idx].replace(' ' + device.split(':')[0] + ' ', ' ' + device.split(':')[1] + ' ')
        }

        return fhem.request('text', cmdList.join(';'))
    }

    function runItem(item) {
        open.value = false
        doCmd(item.cmd)
    }

    function showHint(idx) {
        clearTimeout(hintTimer)
        hintIdx.value = idx
        hintTimer = setTimeout(() => hintIdx.value = null, 1500)
    }

    // event handlers for menu items which need a long press
    function longPressHandlers(idx, item) {
        return {
            pointerdown: (evt) => lp.start(idx, evt, () => runItem(item)),
            pointermove: (evt) => lp.move(evt),
            pointerup: () => { if(!lp.end()) showHint(idx) },
            pointercancel: () => lp.cancel(),
            pointerleave: () => lp.cancel(),
            contextmenu: (evt) => evt.preventDefault()
        }
    }

    watch(open, (val) => {
        if(!val) {
            lp.cancel()
            hintIdx.value = null
        }
    })

    loadMenu()
</script>

<template>
    <v-menu v-model="open" :close-on-content-click="false">
        <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                icon
                :variant="btn.variant"
                :disabled="btn.disabled || menuItems.length < 1"
                :color="btn.color"
                class="my-2">
                <v-icon size="large">
                    {{ btn.icon }}
                </v-icon>
            </v-btn>
        </template>
        <v-list>
            <v-list-item
                v-for="(item, idx) of menuItems"
                :key="idx"
                :value="idx"
                :active="isCurrent(item)"
                :color="current.color"
                :prepend-icon="hasCurrent ? (isCurrent(item) ? 'mdi-check' : 'mdi-blank') : undefined"
                :append-icon="item.long ? 'mdi-gesture-tap-hold' : undefined"
                :class="{ 'fa-menu-long': item.long }"
                @click="item.long ? null : runItem(item)"
                v-on="item.long ? longPressHandlers(idx, item) : {}">
                <v-list-item-title>{{ item.name }}</v-list-item-title>
                <v-list-item-subtitle v-if="hintIdx === idx">{{ $t('_app.menu.longPress') }}</v-list-item-subtitle>
                <div
                    v-if="lpPressed === idx"
                    class="fa-menu-longpress-bar bg-primary"
                    :style="{ animationDuration: lp.duration + 'ms' }">
                </div>
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<style scoped>
    .fa-menu-long {
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        touch-action: pan-y;
    }

    .fa-menu-longpress-bar {
        position: absolute;
        left: 0;
        bottom: 0;
        height: 3px;
        width: 0;
        animation-name: fa-menu-longpress;
        animation-timing-function: linear;
        animation-fill-mode: forwards;
    }

    @keyframes fa-menu-longpress {
        from { width: 0; }
        to { width: 100%; }
    }
</style>
