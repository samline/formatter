import sections from './sections'
import common from '../../../../../shared/i18n/translations/en/common'
import controls from '../../../../../shared/i18n/translations/en/controls'
import { project } from '../../../../../shared/lib/project.mjs'
export default {
  sections,
  common,
  controls,
  navigation: {
    mainLabel: 'Main navigation',
    skipContent: 'Skip to content',
    mobile: {
      title: `Explore ${project.name}`,
      introduction:
        'Format a field, try every format type, and look up options when you need them.',
      resources: 'Around the project',
      label: 'Mobile navigation',
      open: 'Open navigation menu',
      close: 'Close navigation menu',
    },
    footer: {
      description: project.description,
      label: 'Footer navigation',
      explore: 'Explore',
      project: 'Project',
      setup: 'Installation guide',
      examples: 'Working examples',
      changelog: 'Changelog',
      backToTop: 'Back to top',
      credit: `${project.author} · Made for the open web.`,
    },
    items: [
      {
        href: '#features',
        label: 'Overview',
        description: 'Understand the problem and the approach.',
      },
      {
        href: '#how',
        label: 'Get started',
        description: 'Choose your setup and follow the first steps.',
      },
      {
        href: '#recipes',
        label: 'Recipes',
        description: 'Useful patterns and integration context.',
      },
      { href: '#faq', label: 'FAQ', description: 'Find the practical details.' },
      { page: 'examples', label: 'Examples', description: 'Try a preview and explore its code.' },
      {
        docsRoute: 'overview',
        label: 'Docs',
        description: 'Read guides and the complete reference.',
      },
    ],
  },
  examples: {
    exploreAction: 'Try the examples',
    installAction: 'Installation guide',
    recipeEyebrow: '01 / A formatted field',
    eyebrow: 'Examples',
    title: `${project.name} examples.`,
    accent: 'examples.',
    description:
      'Six real form fields, each with live formatted and raw values and copyable HTML / CDN and Package / ESM files.',
    possibilities:
      'These examples show a few possibilities. Combine format types, options and regex rules with your own forms, frameworks and validation to build the fields your project needs.',
    guide: 'Read the example guide',
    navigation: 'Choose an example',
    accessibility:
      'Every field keeps a visible label, a native inputmode and autocomplete hint, and a described raw value. Formatter supplies strings; your markup supplies accessibility.',
  },
} as const
