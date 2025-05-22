import { None, type Option, Some } from "~/types/Option"

export const randomInt = (max: number) => Math.floor(Math.random() * max)

export function randomPickArray<A>(values: A[]): Option<A> {
  return values.length === 0 ? None.of() : Some.of(values[randomInt(values.length)])
}

export function randomPickNonEmptyList<A>(items: A[]): A {
  return randomPickArray(items).getOrElse(() => {
    throw new Error("Cannot pick from empty list")
  })
}
