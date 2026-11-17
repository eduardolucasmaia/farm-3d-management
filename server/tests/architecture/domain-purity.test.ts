import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const domainDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'domain')

function listTsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return listTsFiles(full)
    return full.endsWith('.ts') ? [full] : []
  })
}

const forbiddenText = ['Date.now(', 'new Date()', 'Math.random(', 'process.', 'console.']
const importPattern = /(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g

describe('pureza do núcleo de domínio (princípio I)', () => {
  it('a pasta do domínio existe e tem arquivos', () => {
    expect(existsSync(domainDir)).toBe(true)
    expect(listTsFiles(domainDir).length).toBeGreaterThan(0)
  })

  it('o domínio só importa arquivos do próprio domínio', () => {
    const violations: string[] = []
    for (const file of listTsFiles(domainDir)) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(importPattern)) {
        const spec = match[1] ?? match[2] ?? ''
        const isRelative = spec.startsWith('./') || spec.startsWith('../')
        const target = isRelative ? resolve(dirname(file), spec) : ''
        const insideDomain = isRelative && !relative(domainDir, target).startsWith('..')
        if (!insideDomain) violations.push(`${relative(domainDir, file)} importa '${spec}'`)
      }
    }
    expect(violations).toEqual([])
  })

  it('o domínio não lê relógio, acaso, ambiente nem console', () => {
    const violations: string[] = []
    for (const file of listTsFiles(domainDir)) {
      const text = readFileSync(file, 'utf8')
      for (const token of forbiddenText) {
        if (text.includes(token)) violations.push(`${relative(domainDir, file)} contém '${token}'`)
      }
    }
    expect(violations).toEqual([])
  })
})
