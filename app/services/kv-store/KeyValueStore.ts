import { Either } from "~/types/Either"
import { None, Option, Some } from "~/types/Option"
import { reportError } from "~/services/ErrorReporting"

export interface Encoder<A, B> {
  encode(value: A): B
}

export interface Decoder<A, B> {
  decode(value: A): B
}

export interface Codec<A, B> extends Encoder<A, B>, Decoder<B, A> {}

export interface KeySpace<K, V> {
  readonly name: string

  readonly keyEncoder: Encoder<K, string>

  readonly valueCodec: Codec<V, string>
}

export interface KeyValueStore<K, V extends {}> {
  put(key: K, value: V): void

  get(key: K): Option<V>

  remove(key: K): Option<V>
}

// Storage access throws when it is blocked (privacy settings, sandboxed frames) or full.
// Callers treat this store as best-effort, so an unavailable store reads as empty.
const removeItem = (key: string): void => {
  Either.fromTry(() => localStorage.removeItem(key))
}

export class LocalKeyValueStore<K, V extends {}> implements KeyValueStore<K, V> {
  constructor(readonly keySpace: KeySpace<K, V>) {}

  get(key: K): Option<V> {
    const stringValue: Option<string> =
      Either.fromTry(() => localStorage.getItem(this.stringKey(key)))
        .toOption()
        .flatMap(value => Option.fromNullable(value))

    return stringValue.flatMap(value =>
      Either.fromTry(() => this.keySpace.valueCodec.decode(value))
        .fold<Option<V>>(
          () => {
            removeItem(this.stringKey(key))
            return None.of()
          },
          decodedValue => Some.of(decodedValue)
        )
    )
  }

  put(key: K, value: V): void {
    const stringKey = this.stringKey(key)

    Either.fromTry(() => localStorage.setItem(stringKey, this.keySpace.valueCodec.encode(value)))
      .fold(
        error => reportError("Unable to write to local storage", error),
        () => undefined
      )
  }

  remove(key: K): Option<V> {
    const existingValue = this.get(key)
    removeItem(this.stringKey(key))

    return existingValue
  }

  stringKey = (key: K): string => `${this.keySpace.name}-${this.keySpace.keyEncoder.encode(key)}`
}
