import { Either, Just, Maybe, None, Right } from "monet"
import { Decoder, Encoder } from "models/Codec"

export interface Range<A> {
  min: A
  max: Maybe<A>
}

export function toNumberArray<A>(range: Range<A>, maximum: A, encoder: Encoder<A, number>): number[] {
  return [
    encoder.encode(range.min),
    range.max.map(encoder.encode).getOrElse(encoder.encode(maximum))
  ]
}

export function fromNumberArray<A>(input: number[], decoder: Decoder<number, A>, isMax: (value: A) => boolean): Either<Error, Range<A>> {
  const [minValue, maxValue] = input

  return decoder.decode(minValue)
    .flatMap(minA =>
      decoder.decode(maxValue)
        .map(maxA => ({min: minA, max: Just(maxA).filter(value => !isMax(value))}))
    )
}

export function rangeEncoder<A>(encoder: Encoder<A, string>): Encoder<Range<A>, string> {
  return {
    encode(range: Range<A>): string {
      return encoder.encode(range.min) + "-" + range.max.map(max => encoder.encode(max)).getOrElse("")
    }
  }
}

export function rangeDecoder<A>(decoder: Decoder<string, A>): Decoder<string, Range<A>> {
  return {
    decode(input: string): Either<Error, Range<A>> {
      const [minString, maxString] = input.split('-')

      const eitherMin: Either<Error, A> = decoder.decode(minString)

      const maybeEitherMax: Maybe<Either<Error, A>> = Maybe.fromFalsy(maxString).map(decoder.decode)

      return eitherMin
        .flatMap(min => maybeEitherMax.fold<Either<Error, Range<A>>>(Right({ min, max: None() }))(maxEither =>
            maxEither.map(max => ({min, max: Just(max)}))
          )
        )
    }
  }
}