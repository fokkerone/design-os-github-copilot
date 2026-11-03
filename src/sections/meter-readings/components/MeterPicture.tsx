/** A meter display with the digits that count marked: the white-on-black digits, not the red ones */
export function MeterPicture({ digits = '013995', marked = 5 }: { digits?: string; marked?: number }) {
  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={`Meter display. The first ${marked} digits count, the last digit in red does not.`}
        className="flex items-center justify-center gap-1 rounded-lg bg-stone-900 p-3 dark:bg-stone-950"
      >
        {digits.split('').map((d, i) => (
          <span
            key={i}
            className={`flex h-10 w-7 items-center justify-center rounded-sm font-mono text-xl font-semibold ${
              i < marked
                ? 'bg-stone-50 text-stone-900 ring-2 ring-teal-400' /* token: primary */
                : 'bg-red-700 text-white'
            }`}
          >
            {d}
          </span>
        ))}
      </div>
      <figcaption className="mt-2 text-xs text-stone-500 dark:text-stone-400">Only the white digits count. Ignore the red one.</figcaption>
    </figure>
  )
}
