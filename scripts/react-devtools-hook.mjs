/**
 * Vite plugin (dev only) for Live Edit: keeps the renderer internals React hands to the DevTools
 * hook, so the preview can override a component's props live, like the React DevTools do
 * (`overrideProps`, src/lib/live-edit/prop-override.ts).
 *
 * React (react-dom 19) calls `__REACT_DEVTOOLS_GLOBAL_HOOK__.inject(internals)` once when it
 * loads. The React Refresh preamble creates the hook too, but drops the internals. This script
 * runs first (a classic inline script in <head>, before any module), creates the hook the same
 * way when the DevTools extension has not, and records what `inject` receives on
 * `window.__DOS_REACT_RENDERERS__`. The extension and Fast Refresh keep working.
 */
export const HOOK_SCRIPT = `(function () {
  var g = window
  var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__
  if (!hook) {
    var nextID = 0
    hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      renderers: new Map(),
      supportsFiber: true,
      inject: function (injected) { var id = ++nextID; this.renderers.set(id, injected); return id },
      onScheduleFiberRoot: function () {},
      onCommitFiberRoot: function () {},
      onCommitFiberUnmount: function () {},
    }
  }
  var renderers = (g.__DOS_REACT_RENDERERS__ = [])
  var inject = hook.inject
  hook.inject = function (injected) {
    renderers.push(injected)
    return inject.apply(this, arguments)
  }
})()`

export default function reactDevtoolsHook() {
  return {
    name: 'designos-react-devtools-hook',
    apply: 'serve',
    transformIndexHtml() {
      return [{ tag: 'script', children: HOOK_SCRIPT, injectTo: 'head-prepend' }]
    },
  }
}
