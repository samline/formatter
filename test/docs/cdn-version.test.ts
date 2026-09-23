// @vitest-environment node

import { readFile, readdir, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import packageJson from '../../package.json'

const documentationRoots = ['README.md', 'docs', 'example/src/content/docs']
const cdnUrlPattern = /https:\/\/(?:unpkg\.com\/|cdn\.jsdelivr\.net\/npm\/)@samline\/formatter(?:@([^/\s"`]+))?\/[^\s"`)]+/g

async function findMarkdownFiles(path: string): Promise<string[]> {
  const pathStats = await stat(path)
  if (pathStats.isFile()) {
    return ['.md', '.mdx'].includes(extname(path)) ? [path] : []
  }

  const entries = await readdir(path, { withFileTypes: true })
  const nestedFiles = await Promise.all(
    entries.map((entry) => findMarkdownFiles(join(path, entry.name)))
  )

  return nestedFiles.flat().filter((file) => ['.md', '.mdx'].includes(extname(file)))
}

describe('browser CDN documentation', () => {
  it('pins every formatter URL to the documented package version', async () => {
    const files = (await Promise.all(documentationRoots.map(findMarkdownFiles))).flat()
    const references: Array<{ file: string; version: string | undefined }> = []

    for (const file of files) {
      const contents = await readFile(file, 'utf8')

      for (const match of contents.matchAll(cdnUrlPattern)) {
        references.push({ file, version: match[1] })
      }
    }

    expect(references.length).toBeGreaterThan(0)
    expect(references, 'CDN URLs must never use `latest` or omit the version').toEqual(
      references.map(({ file }) => ({ file, version: packageJson.version }))
    )
  })
})
