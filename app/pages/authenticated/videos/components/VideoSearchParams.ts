import {type DurationRange, durationRangeDecoder, durationRangeStringEncoder} from "~/models/DurationRange"
import {type Range, rangeDecoder, rangeEncoder} from "~/models/Range"
import type {Decoder, Encoder} from "~/models/Codec"
import {simpleStringEncoder, stringToNumberDecoder} from "~/models/Codec"
import {maybeString} from "~/utils/StringUtils"
import {SortBy} from "~/models/SortBy"
import {None, Option} from "~/types/Option"
import {Duration} from "luxon"
import {Either, Left, Right} from "~/types/Either"
import {Ordering} from "~/models/Ordering"

export enum VideoSearchParamName {
  DurationRange = "duration-range",
  SizeRange = "size-range",
  SearchTerm = "search-term",
  SortBy = "sort-by",
  Site = "site",
  Ordering = "ordering",
}

/** How one query-string parameter of the videos page is read, written and defaulted. */
export interface VideoSearchParameter<A, B extends VideoSearchParamName> {
  readonly name: B
  readonly default: A
  readonly encoder: Encoder<A, string>
  readonly decoder: Decoder<string, A>
}

const decodeEnum = <A>(record: Record<string, A>, type: string): Decoder<string, A> => ({
  decode(input: string): Either<Error, A> {
    return Option.fromNullable(Object.values(record).find((value) => value === input))
      .fold(() => Left.of(new Error(`Unable to parse "${input}" as ${type}`)), (value) => Right.of(value))
  }
})

export const DurationRangeSearchParam: VideoSearchParameter<DurationRange, VideoSearchParamName.DurationRange> = {
  name: VideoSearchParamName.DurationRange,
  default: { min: Duration.fromObject({ minutes: 0 }), max: None.of() },
  decoder: rangeDecoder(durationRangeDecoder),
  encoder: rangeEncoder(durationRangeStringEncoder),
}

export const SizeRangeSearchParam: VideoSearchParameter<Range<number>, VideoSearchParamName.SizeRange> = {
  name: VideoSearchParamName.SizeRange,
  default: { min: 0, max: None.of() },
  decoder: rangeDecoder(stringToNumberDecoder),
  encoder: rangeEncoder(simpleStringEncoder()),
}

export const SearchTermSearchParam: VideoSearchParameter<Option<string>, VideoSearchParamName.SearchTerm> = {
  name: VideoSearchParamName.SearchTerm,
  default: None.of(),
  decoder: {
    decode(value: string): Either<Error, Option<string>> {
      return Right.of(maybeString(value))
    },
  },
  encoder: {
    encode(value: Option<string>): string {
      return value.getOrElse(() => "")
    },
  },
}

export const SortBySearchParam: VideoSearchParameter<SortBy, VideoSearchParamName.SortBy> = {
  name: VideoSearchParamName.SortBy,
  default: SortBy.Date,
  decoder: decodeEnum(SortBy, "SortBy"),
  encoder: simpleStringEncoder(),
}

export const OrderingSearchParam: VideoSearchParameter<Ordering, VideoSearchParamName.Ordering> = {
  name: VideoSearchParamName.Ordering,
  default: Ordering.Descending,
  decoder: decodeEnum(Ordering, "Ordering"),
  encoder: simpleStringEncoder(),
}

export const VideoSitesSearchParam: VideoSearchParameter<string[], VideoSearchParamName.Site> = {
  name: VideoSearchParamName.Site,
  default: [],
  decoder: {
    decode(value: string): Either<Error, string[]> {
      return Right.of(value.split(",").flatMap((term) => maybeString(term).toList()))
    },
  },
  encoder: {
    encode(sites: string[]): string {
      return sites.join(",")
    },
  },
}

export function parseSearchParam<A, B extends VideoSearchParamName>(
  urlSearchParams: URLSearchParams,
  videoSearchParameter: VideoSearchParameter<A, B>
): A {
  return Option.fromNullable(urlSearchParams.get(videoSearchParameter.name))
    .flatMap((stringValue) => videoSearchParameter.decoder.decode(stringValue).toOption())
    .getOrElse(() => videoSearchParameter.default)
}
