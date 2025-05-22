import z from "zod/v4"
import { ZodOptional } from "~/types/Zod"

export const SearchResult = <A>(type: z.ZodType<A>) =>
  z.object({
    results: z.array(type),
    pageNumber: z.number(),
    pageSize: z.number(),
    searchTerm: ZodOptional(z.string())
  })

export type SearchResult<A> = z.infer<ReturnType<typeof SearchResult<A>>>
