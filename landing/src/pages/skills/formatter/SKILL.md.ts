import type { APIRoute } from 'astro'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Serve the maintained package skill; never keep a second copy in the site.
export const GET: APIRoute = async () =>
  new Response(await readFile(resolve('../skills/formatter/SKILL.md'), 'utf8'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
