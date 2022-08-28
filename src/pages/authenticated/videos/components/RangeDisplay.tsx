import React from "react"
import Range from "models/Range"
import { Duration } from "moment"
import { humanReadableSize } from "utils/Formatter"

export interface PrettyPrint<A> {
  print(value: A): string
}

export const durationPrettyPrint: PrettyPrint<Duration> = {
  print(duration: Duration): string {
    return `${duration.asMinutes()} minutes`
  },
}

export const dataSizePrettyPrint: PrettyPrint<number> = {
  print(data: number): string {
    return humanReadableSize(data)
  },
}

export default function RangeDisplay<A extends {}>(props: { range: Range<A>; printer: PrettyPrint<A>; className?: string }): JSX.Element {
  return (
    <div className={props.className}>
      <span>{props.printer.print(props.range.min)}</span>
      <span> - </span>
      <span>{props.range.max.map(props.printer.print).getOrElse("Max")}</span>
    </div>
  )
}
