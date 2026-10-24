/** The props of the product's components, provided by scripts/component-props.mjs */
declare module 'virtual:component-props' {
  import type { DeclaredProp } from '@/lib/live-edit/component-props'
  /** file → component → its props */
  const props: Record<string, Record<string, DeclaredProp[]>>
  export default props
}
