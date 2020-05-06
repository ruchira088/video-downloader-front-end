import {Maybe} from "monet";

export default interface SearchResult<A> {
    results: A[]
    pageNumber: number
    pageSize: number
    searchTerm: Maybe<string>
}
