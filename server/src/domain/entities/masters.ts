// Tipos de operador e arquivo 3D (data-model.md, "Catálogo de produção"). Só tipos.

export interface Operator {
  id: number
  name: string
  userId: number | null
}

export interface File3D {
  id: number
  name: string
}

export interface File3DVersion {
  id: number
  file3DId: number
  versionLabel: string
  storagePath: string
  createdAt: string
}
