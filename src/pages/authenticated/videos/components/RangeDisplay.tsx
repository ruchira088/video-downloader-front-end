import React from "react"
import Range from "models/Range"
import { Duration } from "moment"

export interface PrettyPrint<A> {
  print(value: A): string
}

export const durationPrettyPrint: PrettyPrint<Duration> = {
  print(duration: Duration): string {
    return `${duration.asMinutes()} minutes`;
  }
}

export const dataSizePrettyPrint: PrettyPrint<number> = {
  print(data: number): string {
    return `${data/1000} MB`;
  }
}

export default function<A>(props: {range: Range<A>, printer: PrettyPrint<A>}): JSX.Element {
  return (
    <div>
      <span>{props.printer.print(props.range.min)}</span>
      <span> - </span>
      <span>{props.range.max.map(props.printer.print).getOrElse("Max")}</span>
    </div>
  )
}