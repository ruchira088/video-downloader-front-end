const localStorage: Storage = window.localStorage

export interface Codec<A, B> {
  encode(value: A): B

  decode(value: B): A
}

export interface KeySpace<K, V> {
  readonly name: string

  readonly keyCodec: Codec<K, string>

  readonly valueCodec: Codec<V, string>
}

export default interface KeyValueStore<K, V extends {}> {
  put(key: K, value: V): void

  get(key: K): V | null

  remove(key: K): V | null
}

export class LocalKeyValueStore<K, V extends {}> implements KeyValueStore<K, V> {
  constructor(readonly keySpace: KeySpace<K, V>) {}

  get(key: K): V | null {
    const stringValue: string | null = localStorage.getItem(this.stringKey(key))

    if (stringValue !== null) {
      return this.keySpace.valueCodec.decode(stringValue)
    } else {
      return null
    }
  }

  put(key: K, value: V): void {
    localStorage.setItem(this.stringKey(key), this.keySpace.valueCodec.encode(value))
  }

  remove(key: K): V | null {
    const existingValue = this.get(key)

    localStorage.removeItem(this.stringKey(key))

    return existingValue
  }

  stringKey = (key: K): string => `${this.keySpace.name}-${this.keySpace.keyCodec.encode(key)}`
}
