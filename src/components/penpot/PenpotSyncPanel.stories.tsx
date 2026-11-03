import type { Meta, StoryObj } from '@storybook/react-vite'
import type { PenpotClient, PenpotStatus } from '@/lib/penpot/client'
import { PenpotSyncPanel } from './PenpotSyncPanel'

const sections = [
  { id: 'account', screens: ['Login', 'Profile'] },
  { id: 'meter-readings', screens: ['ReadingForm', 'ReadingReview'] },
]
const link = { fileId: 'file', teamId: 'team', name: 'Sample product', url: 'http://localhost:9001/' }
const base: PenpotStatus = { configured: { key: true, token: true }, link, sections, penpotUrl: 'http://localhost:9001', connection: { state: 'connected' } }

const fake = (status: PenpotStatus): PenpotClient => ({
  status: async () => status,
  createFile: async () => link,
  run: async (_action, onEvent) => onEvent({ step: 'tokens', message: 'designos/color: 250/355' }),
})

const meta = {
  title: 'Design OS/penpot/PenpotSyncPanel',
  component: PenpotSyncPanel,
} satisfies Meta<typeof PenpotSyncPanel>
export default meta
type Story = StoryObj<typeof meta>

export const Connected: Story = { args: { client: fake(base) } }
export const NoKey: Story = { args: { client: fake({ ...base, configured: { key: false, token: false }, link: null, connection: { state: 'no-key' } }) } }
export const NoFile: Story = { args: { client: fake({ ...base, link: null, connection: { state: 'not-connected' } }) } }
export const FileDeleted: Story = { args: { client: fake({ ...base, link: null, goneFile: 'Sample product', connection: { state: 'not-connected' } }) } }
export const WrongFile: Story = { args: { client: fake({ ...base, connection: { state: 'wrong-file', file: { id: 'x', name: 'Another file' } } }) } }
export const WithReport: Story = {
  args: {
    client: fake({
      ...base,
      link: {
        ...link,
        lastSync: {
          action: 'all',
          at: '2026-11-03T10:00:00.000Z',
          tokens: { created: 0, updated: 2, same: 548, failed: [] },
          components: { total: 40, created: 3, unchanged: 37 },
          tokenViolations: [{ kind: 'color', value: '#292524 / 0.4', where: ['src/sections/sample/List.tsx:37:17'] }],
          boards: [{ board: 'Login / desktop / light', section: 'account', shapes: 3, instances: 2, offsets: [], pixels: { sizeMatches: true, share: 0.4, textShare: 7.1, outsideText: 0, insideText: 3200 } }],
        },
      },
    }),
  },
}
