import { Maybe } from "monet"

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

export default interface KeyValueStore<K, V> {
  put(key: K, value: V): void

  get(key: K): Maybe<V>

  remove(key: K): Maybe<V>
}

export class LocalKeyValueStore<K, V> implements KeyValueStore<K, V> {
  constructor(readonly keySpace: KeySpace<K, V>) {}

  get(key: K): Maybe<V> {
    return Maybe.fromFalsy(localStorage.getItem(this.stringKey(key))).map(this.keySpace.valueCodec.decode)
  }

  put(key: K, value: V): void {
    localStorage.setItem(this.stringKey(key), this.keySpace.valueCodec.encode(value))
  }

  remove(key: K): Maybe<V> {
    return this.get(key).map((value) => {
      localStorage.removeItem(this.stringKey(key))

      return value
    })
  }

  stringKey = (key: K): string => `${this.keySpace.name}-${this.keySpace.keyCodec.encode(key)}`
}
