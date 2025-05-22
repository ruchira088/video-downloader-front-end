import { type Decoder, type Encoder } from "~/models/Codec"
import { None, Option, Some } from "~/types/Option"
import { type Either, Right } from "~/types/Either"
import { z } from "zod/v4"
import { ZodOptional } from "~/types/Zod"

export const Range = <A>(type: z.ZodType<A>) => z.object({
  min: type,
  max: ZodOptional(type)
})

export type Range<A> = z.infer<ReturnType<typeof Range<A>>>

export function toNumberArray<A extends {}>(range: Range<A>, maximum: A, encoder: Encoder<A, number>): number[] {
  return [encoder.encode(range.min), range.max.map(encoder.encode).getOrElse(() => encoder.encode(maximum))]
}

export function fromNumberArray<A>(
  input: number[],
  decoder: Decoder<number, A>,
  isMax: (value: A) => boolean
): Either<Error, Range<A>> {
  const [minValue, maxValue] = input

  return decoder
    .decode(minValue)
    .flatMap((minA) =>
      decoder.decode(maxValue).map((maxA) => ({ min: minA, max: Some.of(maxA).filter((value) => !isMax(value)) }))
    )
}

export function rangeEncoder<A extends {}>(encoder: Encoder<A, string>): Encoder<Range<A>, string> {
  return {
    encode(range: Range<A>): string {
      return encoder.encode(range.min) + "-" + range.max.map((max) => encoder.encode(max)).getOrElse(() => "")
    },
  }
}

export function rangeDecoder<A extends {}>(decoder: Decoder<string, A>): Decoder<string, Range<A>> {
  return {
    decode(input: string): Either<Error, Range<A>> {
      const [minString, maxString] = input.split("-")

      const eitherMin: Either<Error, A> = decoder.decode(minString)

      const maybeEitherMax: Option<Either<Error, A>> = Option.fromNullable(maxString).map(decoder.decode)

      return eitherMin.flatMap(min =>
        maybeEitherMax.fold<Either<Error, Range<A>>>(
          () => Right.of<Error, Range<A>>({ min, max: None.of() }),
          maxEither => maxEither.map(max => ({ min, max: Some.of(max) }))
        )
      )
    },
  }
}
