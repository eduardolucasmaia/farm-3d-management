-- T034 (US2): operadores e arquivo 3D com versões (data-model.md, "Catálogo de produção").

CREATE TABLE operators (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) > 0),
  user_id INTEGER REFERENCES users(id)
);

CREATE TABLE files_3d (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) > 0)
);

CREATE TABLE file_3d_versions (
  id INTEGER PRIMARY KEY,
  file_3d_id INTEGER NOT NULL REFERENCES files_3d(id),
  version_label TEXT NOT NULL CHECK (length(version_label) > 0),
  storage_path TEXT NOT NULL CHECK (length(storage_path) > 0),
  created_at TEXT NOT NULL,
  UNIQUE (file_3d_id, version_label)
);

CREATE INDEX idx_file_3d_versions_file ON file_3d_versions (file_3d_id);
