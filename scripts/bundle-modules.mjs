/**
 * Vite plugin (build only): writes `dist/.vite/modules.json`, the modules of every chunk and the
 * chunks each one imports, so scripts/tests/build-separation.test.mjs can check that the Design OS
 * entry (index.html) reaches no prototype module and the preview (preview.html) no Design OS UI.
 */
export default function bundleModules() {
  return {
    name: 'designos-bundle-modules',
    apply: 'build',
    generateBundle(_options, bundle) {
      const chunks = {}
      for (const [file, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue
        chunks[file] = {
          entry: chunk.isEntry ? chunk.facadeModuleId : null,
          modules: Object.keys(chunk.modules).map((id) => id.replace(process.cwd(), '')),
          imports: [...chunk.imports, ...chunk.dynamicImports],
        }
      }
      this.emitFile({ type: 'asset', fileName: '.vite/modules.json', source: JSON.stringify(chunks, null, 2) })
    },
  }
}
