import { manifest } from '../../../../../shared/lib/project.mjs'
export default {
  name: manifest.name,
  versionLabel: 'v{version}',
  docs: 'Documentation',
  examples: 'Working examples',
  examplesDescription: 'Try the shared preview, then copy its individual files.',
  github: 'GitHub',
  skip: 'Skip to content',
  license: manifest.license,
  footer: 'Made for the web. Built with care.',
  changelog: {
    title: 'Changelog',
    description:
      'Release history for @samline/formatter: fixes, behavior changes and explicitly marked breaking changes.',
  },
  reading: 'Guide',
  apiReading: 'Reference',
}
