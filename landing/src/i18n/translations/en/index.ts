import sections from './sections'
import { footerCredit } from '../../../../../shared/lib/site-identity.mjs'
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
      resources: 'Around the package',
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
      skill: 'Formatter skill for AI agents',
      changelog: 'Changelog',
      backToTop: 'Back to top',
      credit: footerCredit(project.credit),
    },
    items: [
      {
        href: '#features',
        label: 'Overview',
        description: 'What Formatter does, and what it leaves to your form.',
      },
      {
        href: '#how',
        label: 'Get started',
        description: 'Install it and format your first field.',
      },
      {
        href: '#recipes',
        label: 'Recipes',
        description: 'Stored values, regional numbers and paired validation.',
      },
      {
        href: '#faq',
        label: 'FAQ',
        description: 'Answers about raw values, pasting, caret and validation.',
      },
      {
        page: 'examples',
        label: 'Examples',
        description: 'Try eighteen live fields and copy their files.',
      },
      {
        docsRoute: 'overview',
        label: 'Docs',
        description: 'Read the guides and the complete reference.',
      },
    ],
  },
  examples: {
    exploreAction: 'Try the examples',
    installAction: 'Installation guide',
    recipeEyebrow: '01 / A formatted field',
    eyebrow: 'Examples',
    title: `${project.name} examples.`,
    seoTitle: 'Examples',
    seoDescription:
      'Eighteen live input formatting examples: phones by country, currencies, ISO dates, date tools, card numbers, custom masks, check digits and validation rules, with copyable HTML / CDN and Package / ESM files.',
    accent: 'examples.',
    description:
      'Eighteen real form fields with live formatted and raw values, validation and copyable HTML / CDN and Package / ESM files.',
    possibilities:
      'These examples show a few possibilities. Combine format types, options and regex rules with your own forms, frameworks and validation to build the fields your project needs.',
    guide: 'Read the example guide',
    skill: 'Download the Formatter skill for AI agents',
    navigation: 'Choose an example',
    accessibility:
      'Every field keeps a visible label, a native inputmode and autocomplete hint, and a described raw value. Formatter supplies strings; your markup supplies accessibility.',
  },
} as const
