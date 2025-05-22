import {z} from "zod/v4"

export const ListResponse = <A>(type: z.ZodType<A>) => z.object({
  results: z.array(type),
})

export type ListResponse<A> = z.infer<ReturnType<typeof ListResponse<A>>>

