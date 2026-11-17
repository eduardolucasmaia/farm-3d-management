import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { openDatabase, withTransaction } from '../../src/infrastructure/db/database.ts'
import { applyMigrations } from '../../src/infrastructure/db/migrate.ts'

const tempDirs: string[] = []
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('migrações', () => {
  it('aplicam em memória e criam a fundação com os padrões', () => {
    const db = openDatabase(':memory:')
    const applied = applyMigrations(db)
    expect(applied[0]).toBe('0001-foundation.sql')
    const settings = db.prepare('SELECT * FROM farm_settings').all()
    expect(settings).toHaveLength(1)
    expect(settings[0]).toMatchObject({
      energy_tariff_cents_per_mwh: null,
      calendar_summary: 'segunda a sexta, 08:00–18:00',
      work_days: '1,2,3,4,5',
      work_start: '08:00',
      work_end: '18:00',
      time_zone: 'America/Sao_Paulo',
      examples_are_fictional: 1,
    })
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name = 'users'").get()).toBeDefined()
  })

  it('não aplicam de novo o que já foi aplicado', () => {
    const db = openDatabase(':memory:')
    applyMigrations(db)
    expect(applyMigrations(db)).toEqual([])
  })

  it('aplicam arquivo novo mesmo com número menor que o último aplicado', () => {
    const dir = mkdtempSync(join(tmpdir(), 'farm3d-mig-'))
    tempDirs.push(dir)
    writeFileSync(join(dir, '0002-b.sql'), 'CREATE TABLE b (id INTEGER PRIMARY KEY);')
    const db = openDatabase(':memory:')
    expect(applyMigrations(db, dir)).toEqual(['0002-b.sql'])
    writeFileSync(join(dir, '0001-a.sql'), 'CREATE TABLE a (id INTEGER PRIMARY KEY);')
    expect(applyMigrations(db, dir)).toEqual(['0001-a.sql'])
  })

  it('recusam marcar exemplo como não fictício', () => {
    const db = openDatabase(':memory:')
    applyMigrations(db)
    expect(() => db.exec('UPDATE farm_settings SET examples_are_fictional = 0')).toThrow()
  })
})

describe('withTransaction', () => {
  function setup() {
    const db = openDatabase(':memory:')
    db.exec('CREATE TABLE t (v INTEGER)')
    const count = () => (db.prepare('SELECT COUNT(*) AS c FROM t').get() as { c: number }).c
    return { db, count }
  }

  it('grava tudo quando a função termina', () => {
    const { db, count } = setup()
    const value = withTransaction(db, () => {
      db.prepare('INSERT INTO t VALUES (1)').run()
      return 'ok'
    })
    expect(value).toBe('ok')
    expect(count()).toBe(1)
  })

  it('desfaz tudo quando a função lança', () => {
    const { db, count } = setup()
    expect(() =>
      withTransaction(db, () => {
        db.prepare('INSERT INTO t VALUES (1)').run()
        throw new Error('falhou')
      }),
    ).toThrow('falhou')
    expect(count()).toBe(0)
  })

  it('desfaz e recusa função assíncrona', () => {
    const { db, count } = setup()
    expect(() =>
      withTransaction(db, () => {
        db.prepare('INSERT INTO t VALUES (1)').run()
        return Promise.resolve(1) as unknown as number
      }),
    ).toThrow(/síncrona/)
    expect(count()).toBe(0)
  })
})
