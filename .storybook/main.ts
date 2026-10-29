import type { StorybookConfig } from '@storybook/react-vite'

/** Storybook of the Design OS UI. Stories live next to the components in src/components, nowhere else. */
const config: StorybookConfig = {
  stories: ['../src/components/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: {
    name: '@storybook/react-vite',
    options: { builder: { viteConfigPath: '.storybook/vite.config.ts' } },
  },
  core: { disableTelemetry: true },
}

export default config
