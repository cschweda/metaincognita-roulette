// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import RouletteWheel from '../../app/components/wheel/RouletteWheel.vue'

describe('RouletteWheel', () => {
  it('renders a canvas', async () => {
    const wrapper = await mountSuspended(RouletteWheel, { props: { variant: 'single', reducedMotion: true } })
    expect(wrapper.find('canvas').exists()).toBe(true)
  })
  it('reduced-motion spinTo emits settled with the target pocket', async () => {
    const wrapper = await mountSuspended(RouletteWheel, { props: { variant: 'single', reducedMotion: true } })
    await (wrapper.vm as unknown as { spinTo: (p: number) => Promise<void> }).spinTo(17)
    const settled = wrapper.emitted('settled')
    expect(settled).toBeTruthy()
    expect(settled![0]![0]).toBe(17)
  })
})
