import { Maybe } from "monet"

export const maybeString = (text: string): Maybe<string> => Maybe.fromNull(text).filter(value => value.trim() !== "")