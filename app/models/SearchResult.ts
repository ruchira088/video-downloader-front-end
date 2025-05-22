import z from "zod/v4"

export const SearchResult = <A>(type: z.ZodType<A>) =>
  z.object({
    results: z.array(type),
    pageNumber: z.number(),
    pageSize: z.number(),
    searchTerm: z.string().nullish(),
  })

export type SearchResult<A> = z.infer<ReturnType<typeof SearchResult<A>>>
