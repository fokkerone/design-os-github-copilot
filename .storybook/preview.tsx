import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Decorator, Preview } from '@storybook/react-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ChatContext } from '@/lib/chat/chat-context'
import { fakeChat, type FakeChat } from './helpers'
import { setFixtureMode, type FixtureMode } from './fixtures/glob'
import './preview.css'

/**
 * Story parameters:
 * - `router: { path, url }`  route pattern and the URL the story opens (default: `/`)
 * - `chat: 'online' | 'offline' | 'working' | 'waiting'`  a fake chat context (default: no chat,
 *   pages then show copy-and-paste commands)
 * - `fixtures: 'filled' | 'empty'`  sample project or a fresh one (default: filled)
 */
declare module '@storybook/react-vite' {
  interface Parameters {
    router?: { path?: string; url?: string }
    chat?: FakeChat
    fixtures?: FixtureMode
  }
}

/** Runs before the story renders, so the loaders see the requested fixture set */
const withFixtures: Decorator = (Story, { parameters }) => {
  setFixtureMode(parameters.fixtures ?? 'filled')
  return <Story />
}

function ChatScope({ kind, children }: { kind?: FakeChat; children: ReactNode }) {
  const value = useMemo(() => (kind ? fakeChat(kind) : null), [kind])
  return value ? <ChatContext.Provider value={value}>{children}</ChatContext.Provider> : children
}

const withChat: Decorator = (Story, { parameters }) => (
  <ChatScope kind={parameters.chat}>
    <Story />
  </ChatScope>
)

/** The story inside the router, read from context so arg changes reach it without a new router */
const StoryElement = createContext<ReactNode>(null)
function RoutedStory() {
  return useContext(StoryElement)
}

/** A memory router per story: the route pattern gives the params, the URL the location */
function MemoryRoute({ path, url, children }: { path: string; url: string; children: ReactNode }) {
  const router = useMemo(
    () => createMemoryRouter([{ path, element: <RoutedStory /> }, { path: '*', element: <RoutedStory /> }], { initialEntries: [url] }),
    [path, url],
  )
  return (
    <StoryElement.Provider value={children}>
      <RouterProvider router={router} />
    </StoryElement.Provider>
  )
}

/** Every Design OS component may link or read the route, so each story gets a router */
const withRouter: Decorator = (Story, { parameters, id }) => {
  const { path = '/', url = '/' } = parameters.router ?? {}
  return (
    <MemoryRoute key={id} path={path} url={url}>
      <Story />
    </MemoryRoute>
  )
}

const preview: Preview = {
  decorators: [
    withRouter,
    withChat,
    withFixtures,
    withThemeByClassName({ themes: { light: 'light', dark: 'dark' }, defaultTheme: 'dark', parentSelector: 'html' }),
  ],
  parameters: {
    layout: 'padded',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'todo' },
  },
  tags: ['autodocs'],
}

export default preview
