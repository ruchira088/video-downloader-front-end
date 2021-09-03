import { Either, Just, Maybe, None, Right } from "monet"

export interface Range<A> {
  min: A
  max: Maybe<A>
}

export interface RangeEncoder<A> {
  encode(value: A): number
}

export interface RangeDecoder<A> {
  decode(value: number): A
}

export function all<A>(decoder: RangeDecoder<A>): Range<A> {
  return { min: decoder.decode(0), max: None() }
}

export function toNumberArray<A>(range: Range<A>, maximum: A, encoder: RangeEncoder<A>): number[] {
  return [
    encoder.encode(range.min),
    range.max.map(max => encoder.encode(max)).getOrElse(encoder.encode(maximum))
  ]
}

export function rangeQueryParameter<A>(range: Range<A>, encoder: RangeEncoder<A>): string {
  return encoder.encode(range.min) + "-" + range.max.map(max => encoder.encode(max).toString(10)).getOrElse("")
}

export function decodeFromString<A>(input: string, decoder: RangeDecoder<A>): Either<Error, Range<A>> {
  const [minString, maxString] = input.split('-')

  const eitherMin: Either<Error, number> = Either.fromTry(() => parseInt(minString, 10))
  const maybeEitherMax: Maybe<Either<Error, number>> =
    Maybe.fromFalsy(maxString).map(value => Either.fromTry(() => parseInt(value, 10)))

  return eitherMin.flatMap(min =>
    maybeEitherMax.fold<Either<Error, Range<A>>>(Right({ min: decoder.decode(min), max: None() }))(eitherMax =>
      eitherMax.map(max => ({ min: decoder.decode(min), max: Just(decoder.decode(max)) })))
  )
}