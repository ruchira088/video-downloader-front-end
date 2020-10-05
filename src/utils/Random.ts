import { Maybe, None, NonEmptyList, Some } from "monet"

export const randomInt = (max: number) => Math.floor(Math.random() * max)

export function randomPickArray<A>(values: A[]): Maybe<A> {
  return values.length === 0 ? None() : Some(values[randomInt(values.length)])
}

export function randomPickNonEmptyList<A>(nonEmptyList: NonEmptyList<A>): A {
  return randomPickArray(nonEmptyList.toArray()).getOrElse(nonEmptyList.copure())
}
