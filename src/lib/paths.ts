/** Every route of the app in one place. Use these instead of string literals. */

const seg = encodeURIComponent

export const paths = {
  vision: '/prototype/vision',
  shell: '/prototype/shell',
  shellFullscreen: '/prototype/shell/fullscreen',
  roadmap: '/prototype/roadmap',
  dataShape: '/prototype/roadmap/data-shape',
  sections: '/prototype/sections',
  section: (id: string) => `/prototype/sections/${seg(id)}`,
  screen: (sectionId: string, name: string) => `/prototype/sections/${seg(sectionId)}/screen-designs/${seg(name)}`,
  screenFullscreen: (sectionId: string, name: string) =>
    `/prototype/sections/${seg(sectionId)}/screen-designs/${seg(name)}/fullscreen`,
  preview: '/prototype/preview',
  previewFullscreen: '/prototype/preview/fullscreen',
  export: '/prototype/export',
  personas: '/personas',
  persona: (id: string) => `/personas/${seg(id)}`,
  flows: '/flows',
  flow: (id: string) => `/flows/${seg(id)}`,
  designSystem: '/design-system',
  components: '/design-system/components',
  techstack: '/techstack',
  wiki: '/wiki',
} as const
