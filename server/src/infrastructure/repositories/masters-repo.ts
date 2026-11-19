import type { Db } from '../db/database.ts'
import type { File3D, File3DVersion, Operator } from '../../domain/entities/masters.ts'

// Repositório para operadores e arquivos 3D (T034, US2).

export interface OperatorRow {
  id: number
  name: string
  user_id: number | null
}

export interface File3DRow {
  id: number
  name: string
}

export interface File3DVersionRow {
  id: number
  file_3d_id: number
  version_label: string
  storage_path: string
  created_at: string
}

// ── Operators ──

export function createOperator(db: Db, name: string, userId: number | null): number {
  const result = db
    .prepare('INSERT INTO operators (name, user_id) VALUES (?, ?)')
    .run(name, userId)
  return result.lastInsertRowid as number
}

export function getOperator(db: Db, id: number): Operator | undefined {
  const row = db.prepare('SELECT * FROM operators WHERE id = ?').get(id) as OperatorRow | undefined
  if (!row) return undefined
  return { id: row.id, name: row.name, userId: row.user_id }
}

export function listOperators(db: Db): Operator[] {
  const rows = db.prepare('SELECT * FROM operators ORDER BY name').all() as unknown as OperatorRow[]
  return rows.map((row) => ({ id: row.id, name: row.name, userId: row.user_id }))
}

export function updateOperator(db: Db, id: number, name: string, userId: number | null): void {
  db.prepare('UPDATE operators SET name = ?, user_id = ? WHERE id = ?').run(name, userId, id)
}

// ── Files 3D ──

export function createFile3D(db: Db, name: string): number {
  const result = db.prepare('INSERT INTO files_3d (name) VALUES (?)').run(name)
  return result.lastInsertRowid as number
}

export function getFile3D(db: Db, id: number): File3D | undefined {
  const row = db.prepare('SELECT * FROM files_3d WHERE id = ?').get(id) as File3DRow | undefined
  if (!row) return undefined
  return { id: row.id, name: row.name }
}

export function listFiles3D(db: Db): File3D[] {
  const rows = db.prepare('SELECT * FROM files_3d ORDER BY name').all() as unknown as File3DRow[]
  return rows.map((row) => ({ id: row.id, name: row.name }))
}

// ── File 3D Versions ──

export function createFile3DVersion(
  db: Db,
  file3DId: number,
  versionLabel: string,
  storagePath: string,
  createdAt: string,
): number {
  const result = db
    .prepare(
      'INSERT INTO file_3d_versions (file_3d_id, version_label, storage_path, created_at) VALUES (?, ?, ?, ?)',
    )
    .run(file3DId, versionLabel, storagePath, createdAt)
  return result.lastInsertRowid as number
}

export function getFile3DVersion(db: Db, id: number): File3DVersion | undefined {
  const row = db
    .prepare('SELECT * FROM file_3d_versions WHERE id = ?')
    .get(id) as File3DVersionRow | undefined
  if (!row) return undefined
  return {
    id: row.id,
    file3DId: row.file_3d_id,
    versionLabel: row.version_label,
    storagePath: row.storage_path,
    createdAt: row.created_at,
  }
}

export function listFile3DVersions(db: Db, file3DId: number): File3DVersion[] {
  const rows = db
    .prepare('SELECT * FROM file_3d_versions WHERE file_3d_id = ? ORDER BY created_at DESC')
    .all(file3DId) as unknown as File3DVersionRow[]
  return rows.map((row) => ({
    id: row.id,
    file3DId: row.file_3d_id,
    versionLabel: row.version_label,
    storagePath: row.storage_path,
    createdAt: row.created_at,
  }))
}

export function deleteFile3DVersion(db: Db, id: number): void {
  db.prepare('DELETE FROM file_3d_versions WHERE id = ?').run(id)
}
