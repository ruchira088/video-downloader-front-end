import { type DurationRange, durationRangeDecoder, durationRangeStringEncoder } from "~/models/DurationRange"
import { type Range, rangeDecoder, rangeEncoder } from "~/models/Range"
import type { Decoder, Encoder } from "~/models/Codec"
import { simpleStringEncoder, stringToNumberDecoder } from "~/models/Codec"
import { maybeString } from "~/utils/StringUtils"
import { SortBy } from "~/models/SortBy"
import { None, Option } from "~/types/Option"
import { Duration } from "luxon"
import { Either, Left, Right } from "~/types/Either"

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
  default: DurationRange = { min: Duration.fromObject({ minutes: 0 }), max: null }

  name: VideoSearchParamName.DurationRange = VideoSearchParamName.DurationRange

  decoder: Decoder<string, DurationRange> = rangeDecoder(durationRangeDecoder)

  encoder: Encoder<DurationRange, string> = rangeEncoder(durationRangeStringEncoder)
}

class SizeRangeSearchParameter implements VideoSearchParameter<Range<number>, VideoSearchParamName.SizeRange> {
  default: Range<number> = { min: 0, max: null }

  name: VideoSearchParamName.SizeRange = VideoSearchParamName.SizeRange

  decoder: Decoder<string, Range<number>> = rangeDecoder(stringToNumberDecoder)

  encoder: Encoder<Range<number>, string> = rangeEncoder(simpleStringEncoder())
}

class SearchTermSearchParameter implements VideoSearchParameter<Option<string>, VideoSearchParamName.SearchTerm> {
  decoder: Decoder<string, Option<string>> = {
    decode(value: string): Either<Error, Option<string>> {
      return Right.of(maybeString(value))
    },
  }

  default: Option<string> = None.of()

  encoder: Encoder<Option<string>, string> = {
    encode(value: Option<string>): string {
      return value.getOrElse(() => "")
    },
  }

  name: VideoSearchParamName.SearchTerm = VideoSearchParamName.SearchTerm
}

class SortBySearchParameter implements VideoSearchParameter<SortBy, VideoSearchParamName.SortBy> {
  decoder: Decoder<string, SortBy> = {
    decode(input: string): Either<Error, SortBy> {
      return Option.fromNullable(Object.entries(SortBy).find(([, value]) => value === input))
        .map(([key]) => key)
        .fold<Either<Error, SortBy>>(
          () => Left.of(new Error(`Unable to parse ${input} as ${SortBy}`)),
          (key) => Right.of(SortBy[key as keyof typeof SortBy])
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
  implements VideoSearchParameter<string[], VideoSearchParamName.Sites>
{
  decoder: Decoder<string, string[]> = {
    decode(value: string): Either<Error, string[]> {
      return Right.of(value.split(",").flatMap((term) => maybeString(term).toList()))
    },
  }

  default: string[] = []

  encoder: Encoder<string[], string> = {
    encode(maybeValues: string[]): string {
      return maybeValues.join(",")
    },
  }

  name: VideoSearchParamName.Sites = VideoSearchParamName.Sites
}

export function parseSearchParam<A extends {}, B extends VideoSearchParamName>(
  urlSearchParams: URLSearchParams,
  videoSearchParameter: VideoSearchParameter<A, B>
): A {
  return Option.fromNullable(urlSearchParams.get(videoSearchParameter.name))
    .flatMap((stringValue) => videoSearchParameter.decoder.decode(stringValue).toOption())
    .getOrElse(() => videoSearchParameter.default)
}

export const DurationRangeSearchParam = new DurationRangeSearchParameter()
export const SizeRangeSearchParam = new SizeRangeSearchParameter()
export const SearchTermSearchParam = new SearchTermSearchParameter()
export const SortBySearchParam = new SortBySearchParameter()
export const VideoSitesSearchParam = new VideoSitesSearchParameter()
