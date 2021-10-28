import { Either, Right } from "monet"

export type Codec<A, B> = Encoder<A, B> & Decoder<B, A>

export function codec<A, B>(encoder: Encoder<A, B>, decoder: Decoder<B, A>): Codec<A, B> {
  return {
    decode(value: B): Either<Error, A> {
      return decoder.decode(value)
    },
    encode(value: A): B {
      return encoder.encode(value)
    },
  }
}

export function identityCodec<A>(): Codec<A, A> {
  return {
    decode<A>(value: A): Either<Error, A> {
      return Right(value)
    },
    encode<A>(value: A): A {
      return value
    },
  }
}

export interface Encoder<A, B> {
  encode(value: A): B
}

export function encodeMap<A, B, C>(encoder: Encoder<A, B>, f: (value: B) => C): Encoder<A, C> {
  return {
    encode(value: A): C {
      return f(encoder.encode(value))
    },
  }
}

export function simpleStringEncoder<A>(): Encoder<A, string> {
  return {
    encode<A>(value: A): string {
      return `${value}`
    },
  }
}

export interface Decoder<B, A> {
  decode(value: B): Either<Error, A>
}

export function decodeMap<A, B, C>(decoder: Decoder<A, B>, f: (value: B) => C): Decoder<A, C> {
  return {
    decode(value: A): Either<Error, C> {
      return decoder.decode(value).map(f)
    },
  }
}

export const stringToNumberDecoder: Decoder<string, number> = {
  decode(value: string): Either<Error, number> {
    return Either.fromTry(() => parseInt(value, 10))
  },
}
