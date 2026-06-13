import {Option} from "~/types/Option"

export enum Environment {
  Development,
  Branch,
  Staging,
  Production
}

const URL_MAPPINGS: Record<Environment.Staging | Environment.Production, string[]> = {
  [Environment.Staging]: ["staging.videos.ruchij.com"],
  [Environment.Production]: ["videos.ruchij.com"]
}

export const getEnvironment = (): Environment => {
  if (typeof window === "undefined") {
    return Environment.Development
  }

  const isBranch = (host: string): boolean => {
    const branchHostRegex = /^.+\.videos\.ruchij\.com$/;
    return branchHostRegex.test(host);
  }

  const host: string = window.location.host

  return Option.fromNullable(Object.entries(URL_MAPPINGS).find(([_, hosts]) => hosts.includes(host)))
    .map(([env]) => Number(env) as Environment)
    .getOrElse(() => isBranch(host) ? Environment.Branch : Environment.Development)
}