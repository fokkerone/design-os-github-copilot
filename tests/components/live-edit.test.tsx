// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { AssistantRuntimeProvider, useLocalRuntime, type ChatModelAdapter } from '@assistant-ui/react'
import { ChatPane } from '@/components/chat/ChatPane'
import { LiveEditProvider } from '@/components/chat/ChatProvider'
import { Inspector } from '@/components/live-edit/Inspector'
import { createPicker } from '@/lib/live-edit/picker'
import { useLiveEdit } from '@/lib/live-edit/live-edit-context'
import type { FromPreview } from '@/lib/live-edit/protocol'
import { APPLY_EDITS_REQUEST, type LiveSelection } from '@/lib/live-edit/selection'

// The inspector reads the token model; tests choose it (null: the stone/lime fallback)
const tokenModel = vi.hoisted(() => ({ current: null as unknown }))
vi.mock('@/lib/design-tokens-loader', () => ({ loadDesignTokens: () => tokenModel.current }))

const value = (oklch: string) => ({ hex: '', oklch, alpha: 1 })
const voltaTokens = {
  color: {
    palettes: [{ name: 'stone', steps: [{ step: '900', value: value('oklch(21.6% 0.006 56.043)') }] }],
    semantic: [{ name: 'primary', light: value('oklch(65.03% 0.11008 192.46)'), dark: value('oklch(80.08% 0.13033 181.21)') }],
    custom: [],
    alpha: [],
    gradients: [],
  },
  typography: {
    fontFamilies: [],
    fontSizes: [{ name: 'xs', px: 12, rem: '0.75rem', lineHeight: { px: 16, rem: '1rem' } }],
    fontWeights: [{ name: 'bold', value: 700 }],
    textStyles: [{ name: 'xs-bold', label: 'Tailwind/XS/Bold', family: 'Inter', weight: 'Bold', weightValue: 700, sizePx: 12, lineHeightPx: 16, tracking: '0%', utilities: 'text-xs font-bold' }],
  },
  spacing: { scale: [] },
  sizing: [],
  radius: [],
  opacity: [],
  shadows: [],
  effects: [],
  layout: [],
}

const selection: LiveSelection = {
  target: { kind: 'screen', sectionId: 'landing', screenDesignName: 'LandingPage' },
  element: {
    src: 'src/sections/landing/components/Hero.tsx:42:7',
    component: 'Hero',
    componentPath: ['LandingPage', 'Hero'],
    tag: 'h1',
    classes: ['text-6xl'],
    text: 'The platform',
    textOnly: true,
    html: '<h1 class="text-6xl">The platform</h1>',
    styles: {},
  },
  edits: [],
}

describe('picker', () => {
  const pickers: ReturnType<typeof createPicker>[] = []
  afterEach(() => {
    // An active picker captures every click on the document
    pickers.splice(0).forEach((p) => p.destroy())
    document.body.innerHTML = ''
  })

  const mount = () => {
    document.body.innerHTML = `
      <section data-dos-src="src/sections/landing/components/Hero.tsx:3:5" data-dos-comp="Hero">
        <h1 class="text-6xl" data-dos-src="src/sections/landing/components/Hero.tsx:4:7" data-dos-comp="Hero"><b>The</b> platform</h1>
        <p data-dos-src="src/sections/landing/components/Hero.tsx:5:7" data-dos-comp="Hero">Hello</p>
      </section>`
    const messages: FromPreview[] = []
    const picker = createPicker(document, (m) => messages.push(m))
    pickers.push(picker)
    return { picker, messages }
  }

  it('reports the nearest element with a source location, without the attributes in the html', () => {
    const { picker, messages } = mount()
    picker.setActive(true)
    document.querySelector('b')!.click()
    expect(messages).toHaveLength(1)
    const picked = messages[0]
    if (picked.type !== 'dos:picked') throw new Error('expected a pick')
    expect(picked.element).toMatchObject({
      src: 'src/sections/landing/components/Hero.tsx:4:7',
      component: 'Hero',
      componentPath: ['Hero'],
      tag: 'h1',
      classes: ['text-6xl'],
      text: 'The platform',
      textOnly: false,
    })
    expect(picked.element.html).not.toContain('data-dos')
  })

  it('does nothing while inactive, and keeps clicks from reaching the preview while active', () => {
    const { picker, messages } = mount()
    const onClick = vi.fn()
    document.querySelector('p')!.addEventListener('click', onClick)
    document.querySelector('p')!.click()
    expect(messages).toHaveLength(0)
    expect(onClick).toHaveBeenCalledTimes(1)
    picker.setActive(true)
    document.querySelector('p')!.click()
    expect(messages).toHaveLength(1)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('previews edits on the selected element and restores it', () => {
    const { picker } = mount()
    picker.setActive(true)
    const p = document.querySelector('p')!
    p.click()
    picker.preview({ 'font-size': '3rem' }, 'Hi there')
    expect(p.style.fontSize).toBe('3rem')
    expect(p.textContent).toBe('Hi there')
    picker.preview({ color: 'red' })
    expect(p.style.fontSize).toBe('')
    expect(p.textContent).toBe('Hello')
    picker.deselect()
    expect(p.getAttribute('style')).toBeNull()
  })

  it('keeps the preview when a re-render replaces the selected element', async () => {
    const { picker } = mount()
    picker.setActive(true)
    document.querySelector('p')!.click()
    picker.preview({ 'font-size': '3rem' })
    // React swaps the node, as HMR or a state change in the preview can
    const fresh = document.createElement('p')
    fresh.setAttribute('data-dos-src', 'src/sections/landing/components/Hero.tsx:5:7')
    fresh.textContent = 'Hello'
    document.querySelector('p')!.replaceWith(fresh)
    await new Promise((r) => setTimeout(r))
    expect(fresh.style.fontSize).toBe('3rem')
  })

  it('selects an element again by its source location after a reload', () => {
    const { picker, messages } = mount()
    picker.setActive(true)
    document.querySelector('p')!.click()
    const picked = messages[0]
    if (picked.type !== 'dos:picked') throw new Error('expected a pick')
    expect(picked.element.index).toBe(0)
    const again = mount().picker
    again.select(picked.element.src, picked.element.index)
    again.preview({ color: 'red' })
    expect(document.querySelector('p')!.style.color).toBe('red')
  })

  it('reports Escape as cancel', () => {
    const { picker, messages } = mount()
    picker.setActive(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(messages).toEqual([{ type: 'dos:cancel' }])
  })
})

function Select({ value }: { value: LiveSelection }) {
  const live = useLiveEdit()
  useEffect(() => live?.select(value), [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

describe('chat with a picked element', () => {
  function Harness({ adapter }: { adapter: ChatModelAdapter }) {
    const runtime = useLocalRuntime(adapter)
    return (
      <AssistantRuntimeProvider runtime={runtime}>
        <LiveEditProvider>
          <Select value={selection} />
          <ChatPane />
        </LiveEditProvider>
      </AssistantRuntimeProvider>
    )
  }

  it('shows the element as a chip and sends it as context with the request', async () => {
    const seen: string[] = []
    const adapter: ChatModelAdapter = {
      async run({ messages }) {
        const last = messages.at(-1)!
        seen.push(last.content.map((c) => ('text' in c ? c.text : '')).join(''))
        return { content: [{ type: 'text', text: 'Which scope?' }] }
      },
    }
    render(<Harness adapter={adapter} />)
    expect(await screen.findByText('Hero › h1')).toBeInTheDocument()
    const input = screen.getByRole('textbox', { name: /message the agent/i })
    expect(input).toHaveAttribute('placeholder', 'Describe the change…')
    await userEvent.type(input, 'Make it bigger{Enter}')
    expect(await screen.findByText('Which scope?')).toBeInTheDocument()
    expect(seen[0]).toMatch(/^Follow the instructions in \.claude\/commands\/design-os\/live-edit\.md\./)
    expect(seen[0]).toContain('source: src/sections/landing/components/Hero.tsx:42:7')
    expect(seen[0]).toMatch(/Make it bigger$/)
    // The thread shows the request with a folded chip, the composer is free again
    expect(screen.getByText('Make it bigger')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove selected element' })).not.toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Reply to the agent…')
  })

  it('sends the inspector edits to the agent with "Apply with agent"', async () => {
    const seen: string[] = []
    const adapter: ChatModelAdapter = {
      async run({ messages }) {
        seen.push(messages.at(-1)!.content.map((c) => ('text' in c ? c.text : '')).join(''))
        return { content: [{ type: 'text', text: 'Applied.' }] }
      },
    }
    const edited: LiveSelection = { ...selection, edits: [{ property: 'font-size', from: 'text-6xl', to: 'text-7xl', css: { 'font-size': '4.5rem' } }] }
    function LiveInspector() {
      const live = useLiveEdit()
      if (!live?.selection || live.sent) return null
      return <Inspector selection={live.selection} onChange={live.setEdits} onClose={() => live.select(null)} onAddToChat={live.focusComposer} onApply={live.apply} />
    }
    function ApplyHarness() {
      const runtime = useLocalRuntime(adapter)
      return (
        <AssistantRuntimeProvider runtime={runtime}>
          <LiveEditProvider>
            <Select value={edited} />
            <LiveInspector />
            <ChatPane />
          </LiveEditProvider>
        </AssistantRuntimeProvider>
      )
    }
    render(<ApplyHarness />)
    await userEvent.click(await screen.findByRole('button', { name: /apply with agent/i }))
    expect(await screen.findByText('Applied.')).toBeInTheDocument()
    expect(seen[0]).toMatch(/^Follow the instructions in \.claude\/commands\/design-os\/live-edit\.md\./)
    expect(seen[0]).toContain('- font-size: "text-6xl" -> "text-7xl"')
    expect(seen[0]).toMatch(new RegExp(`${APPLY_EDITS_REQUEST.replace(/\./g, '\\.')}$`))
    // Sent: the inspector and the chip are gone until the agent's change arrives
    expect(screen.queryByRole('complementary', { name: 'Inspector' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove selected element' })).not.toBeInTheDocument()
  })

  it('drops the element with the chip button', async () => {
    render(<Harness adapter={{ async run() { return { content: [] } } }} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Remove selected element' }))
    expect(screen.queryByText('Hero › h1')).not.toBeInTheDocument()
  })
})

describe('inspector', () => {
  const props = { onClose: () => {}, onAddToChat: () => {}, onApply: () => {} }
  afterEach(() => {
    tokenModel.current = null
  })

  it('offers the roles of the design system and previews the dark value in a dark preview', async () => {
    tokenModel.current = voltaTokens
    const onChange = vi.fn()
    render(<Inspector selection={{ ...selection, element: { ...selection.element, dark: true } }} onChange={onChange} {...props} />)
    await userEvent.click(screen.getByRole('button', { name: /^Background color:/ }))
    await userEvent.click(screen.getByRole('button', { name: 'primary' }))
    expect(onChange.mock.calls.at(-1)![0]).toEqual([
      {
        property: 'background-color',
        from: null,
        to: 'bg-[oklch(65.03%_0.11008_192.46)]',
        css: { 'background-color': 'oklch(80.08% 0.13033 181.21)' },
        token: 'primary',
        dark: { from: null, to: 'dark:bg-[oklch(80.08%_0.13033_181.21)]' },
      },
    ])
  })

  it('sets size, weight and line height at once with a text style', async () => {
    tokenModel.current = voltaTokens
    const onChange = vi.fn()
    render(<Inspector selection={selection} onChange={onChange} {...props} />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Text style' }), 'text-xs font-bold leading-4')
    expect(onChange.mock.calls.at(-1)![0]).toEqual([
      expect.objectContaining({ property: 'text-style', to: 'text-xs font-bold leading-4', token: 'xs-bold', css: { 'font-size': '0.75rem', 'font-weight': '700', 'line-height': '1rem' } }),
    ])
  })


  it('steps a scale with the arrow keys into a class swap with its preview css, and undoes it', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<Inspector selection={selection} onChange={onChange} {...props} />)
    const size = screen.getByRole('textbox', { name: 'Size' })
    expect(size).toHaveValue('6xl')
    await userEvent.type(size, '{ArrowUp}')
    const edits = onChange.mock.calls.at(-1)![0]
    expect(edits).toEqual([{ property: 'font-size', from: 'text-6xl', to: 'text-7xl', css: { 'font-size': '4.5rem' } }])
    rerender(<Inspector selection={{ ...selection, edits }} onChange={onChange} {...props} />)
    expect(screen.getByText('edited')).toBeInTheDocument()
    await act(() => userEvent.click(screen.getByRole('button', { name: 'Undo' })))
    expect(onChange.mock.calls.at(-1)![0]).toEqual([])
  })

  it('takes a typed value: a token, or a raw value marked as not a token', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<Inspector selection={selection} onChange={onChange} {...props} />)
    const top = screen.getByRole('textbox', { name: 'Padding top' })
    await userEvent.clear(top)
    await userEvent.type(top, '13{Enter}')
    const edits = onChange.mock.calls.at(-1)![0]
    expect(edits).toEqual([{ property: 'padding-top', from: null, to: 'pt-[13px]', css: { 'padding-top': '13px' } }])
    rerender(<Inspector selection={{ ...selection, edits }} onChange={onChange} {...props} />)
    expect(screen.getByText('not a token')).toBeInTheDocument()
  })

  it('picks colors from the palette and toggles icon segments', async () => {
    const onChange = vi.fn()
    render(<Inspector selection={selection} onChange={onChange} {...props} />)
    await userEvent.click(screen.getByRole('button', { name: /^Text:/ }))
    await userEvent.click(screen.getByRole('button', { name: 'stone-900' }))
    expect(onChange.mock.calls.at(-1)![0][0]).toMatchObject({ property: 'color', from: null, to: 'text-stone-900' })
    await userEvent.click(screen.getByRole('button', { name: 'Uppercase' }))
    expect(onChange.mock.calls.at(-1)![0][0]).toMatchObject({ property: 'text-transform', to: 'uppercase' })
  })

  it('switches the paddings and margins guides', async () => {
    const onGuidesChange = vi.fn()
    render(<Inspector selection={selection} onChange={() => {}} {...props} guides={false} onGuidesChange={onGuidesChange} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Show paddings and margins' }))
    expect(onGuidesChange).toHaveBeenCalledWith(true)
  })

  it('edits the content of text-only elements', async () => {
    const onChange = vi.fn()
    render(<Inspector selection={selection} onChange={onChange} {...props} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Content' }), '!')
    expect(onChange.mock.calls.at(-1)![0]).toEqual([{ property: 'content', from: 'The platform', to: 'The platform!', css: {} }])
  })
})
