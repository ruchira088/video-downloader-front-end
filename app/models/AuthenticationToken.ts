import {z} from "zod/v4"
import { ZodDateTime } from "~/types/Zod"

export const AuthenticationToken = z.object({
  secret: z.string(),
  expiresAt: ZodDateTime,
  issuedAt: ZodDateTime,
  renewals: z.number(),
})

export type AuthenticationToken = z.infer<typeof AuthenticationToken>

/**
 * Persisted form of the authentication token. The `secret` is deliberately omitted:
 * authentication rides on cookies, so the secret never needs to be stored where XSS
 * could read it. Decoding strips a `secret` left behind by older stored entries.
 */
export const StoredAuthenticationToken = AuthenticationToken.omit({ secret: true })

export type StoredAuthenticationToken = z.infer<typeof StoredAuthenticationToken>