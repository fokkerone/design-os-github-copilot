/** Stands in for any prototype component: Storybook shows the Design OS UI only */
export default function PrototypePlaceholder() {
  return (
    <div className="flex h-full min-h-48 items-center justify-center border border-dashed border-stone-300 p-6 text-center text-[13px] text-stone-500 dark:border-rwe-neutral-700 dark:text-rwe-neutral-400">
      Prototype preview. Storybook shows the Design OS UI only.
    </div>
  )
}
