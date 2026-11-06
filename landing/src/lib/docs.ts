import { project } from '../../../shared/lib/project.mjs'
const routes = {
  overview: '',
  setup: 'getting-started/',
  options: 'reference/configuration/',
  api: 'reference/api/',
  lifecycle: 'reference/configuration/',
  accessibility: 'guides/styling-and-ux/',
  regex: 'reference/regex/',
  recipes: 'guides/recipes/',
  frameworks: 'guides/frameworks/',
  examples: 'guides/examples/',
  changelog: 'changelog/',
} as const
export type DocsRoute = keyof typeof routes
export const docsHref = (route: DocsRoute) => project.docsBase + routes[route]
