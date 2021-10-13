import { Maybe } from "monet"

export default interface SearchResult<A> {
  readonly results: A[]
  readonly pageNumber: number
  readonly pageSize: number
  readonly searchTerm: Maybe<string>
}
