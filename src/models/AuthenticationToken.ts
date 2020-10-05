import { Moment } from "moment"

export interface AuthenticationToken {
  readonly secret: string
  readonly expiresAt: Moment
  readonly issuedAt: Moment
  readonly renewals: number
}
