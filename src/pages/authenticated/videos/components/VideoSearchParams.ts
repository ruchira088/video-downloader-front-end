import { DurationRange, durationRangeDecoder, durationRangeStringEncoder } from "models/DurationRange"
import Range, { rangeDecoder, rangeEncoder } from "models/Range"
import { Decoder, Encoder, simpleStringEncoder, stringToNumberDecoder } from "models/Codec"
import { duration } from "moment"
import { Either, Left, Maybe, None, NonEmptyList, Right } from "monet"
import { maybeString } from "utils/StringUtils"
import { SortBy } from "models/SortBy"

export enum VideoSearchParamName {
  DurationRange = "duration-range",
  SizeRange = "size-range",
  SearchTerm = "search-term",
  SortBy = "sort-by",
  Sites = "site",
}

export interface VideoSearchParameter<A, B extends VideoSearchParamName> {
  name: B
  default: A
  encoder: Encoder<A, string>
  decoder: Decoder<string, A>
}

class DurationRangeSearchParameter implements VideoSearchParameter<DurationRange, VideoSearchParamName.DurationRange> {
  default: DurationRange = { min: duration(0, "minutes"), max: None() }

  name: VideoSearchParamName.DurationRange = VideoSearchParamName.DurationRange

  decoder: Decoder<string, DurationRange> = rangeDecoder(durationRangeDecoder)

  encoder: Encoder<DurationRange, string> = rangeEncoder(durationRangeStringEncoder)
}

class SizeRangeSearchParameter implements VideoSearchParameter<Range<number>, VideoSearchParamName.SizeRange> {
  default: Range<number> = { min: 0, max: None() }

  name: VideoSearchParamName.SizeRange = VideoSearchParamName.SizeRange

  decoder: Decoder<string, Range<number>> = rangeDecoder(stringToNumberDecoder)

  encoder: Encoder<Range<number>, string> = rangeEncoder(simpleStringEncoder())
}

class SearchTermSearchParameter implements VideoSearchParameter<Maybe<string>, VideoSearchParamName.SearchTerm> {
  decoder: Decoder<string, Maybe<string>> = {
    decode(value: string): Either<Error, Maybe<string>> {
      return Right(maybeString(value))
    },
  }

  default: Maybe<string> = None()

  encoder: Encoder<Maybe<string>, string> = {
    encode(value: Maybe<string>): string {
      return value.getOrElse("")
    },
  }

  name: VideoSearchParamName.SearchTerm = VideoSearchParamName.SearchTerm
}

class SortBySearchParameter implements VideoSearchParameter<SortBy, VideoSearchParamName.SortBy> {
  decoder: Decoder<string, SortBy> = {
    decode(input: string): Either<Error, SortBy> {
      return Maybe.fromNull(Object.entries(SortBy).find(([, value]) => value === input))
        .map(([key]) => key)
        .fold<Either<Error, SortBy>>(Left(new Error(`Unable to parse ${input} as ${SortBy}`)))((key) =>
        Right(SortBy[key as keyof typeof SortBy])
      )
    },
  }

  default: SortBy = SortBy.Date

  encoder: Encoder<SortBy, string> = {
    encode(value: SortBy): string {
      return value
    },
  }

  name: VideoSearchParamName.SortBy = VideoSearchParamName.SortBy
}

class VideoSitesSearchParameter
  implements VideoSearchParameter<Maybe<NonEmptyList<string>>, VideoSearchParamName.Sites>
{
  decoder: Decoder<string, Maybe<NonEmptyList<string>>> = {
    decode(value: string): Either<Error, Maybe<NonEmptyList<string>>> {
      return Right(NonEmptyList.from(value.split(",").filter((term) => maybeString(term).isJust())))
    },
  }

  default: Maybe<NonEmptyList<string>> = None()

  encoder: Encoder<Maybe<NonEmptyList<string>>, string> = {
    encode(maybeValues: Maybe<NonEmptyList<string>>): string {
      return maybeValues.map((nonEmptyList) => nonEmptyList.toArray().join(",")).getOrElse("")
    },
  }

  name: VideoSearchParamName.Sites = VideoSearchParamName.Sites
}

export function parseSearchParam<A extends {}, B extends VideoSearchParamName>(
  urlSearchParams: URLSearchParams,
  videoSearchParameter: VideoSearchParameter<A, B>
): A {
  return Maybe.fromNull(urlSearchParams.get(videoSearchParameter.name))
    .flatMap((stringValue) => videoSearchParameter.decoder.decode(stringValue).toMaybe())
    .getOrElse(videoSearchParameter.default)
}

export const DurationRangeSearchParam = new DurationRangeSearchParameter()
export const SizeRangeSearchParam = new SizeRangeSearchParameter()
export const SearchTermSearchParam = new SearchTermSearchParameter()
export const SortBySearchParam = new SortBySearchParameter()
export const VideoSitesSearchParam = new VideoSitesSearchParameter()
