import type { Meta, StoryObj } from '@storybook/react-vite'
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table'

const meta = {
  title: 'Design OS/UI/Table',
  component: Table,
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

const rows = [
  { section: 'Meter Readings', screens: 3, status: 'Designed' },
  { section: 'Account', screens: 1, status: 'Shaped' },
  { section: 'Billing', screens: 0, status: 'Planned' },
]

export const Default: Story = {
  render: () => (
    <Table className="max-w-xl">
      <TableCaption>Sections of the roadmap</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Section</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Screens</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.section}>
            <TableCell className="font-medium">{row.section}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell className="text-right">{row.screens}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right">4</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
}
