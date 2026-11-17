// O Node 24+ tem um `localStorage` global próprio, indefinido sem --localstorage-file,
// que esconde o do jsdom. Nos testes, o global passa a ser o do jsdom, ou um em memória.
class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value))
  }
}

const jsdomStorage = (globalThis as { jsdom?: { window: { localStorage: Storage } } }).jsdom?.window.localStorage

Object.defineProperty(globalThis, 'localStorage', {
  value: jsdomStorage ?? new MemoryStorage(),
  configurable: true,
  writable: true,
})
