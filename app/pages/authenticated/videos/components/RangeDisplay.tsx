import React from "react"
import { Range } from "~/models/Range"
import { Duration } from "luxon"
import { humanReadableSize } from "~/utils/Formatter"

export interface PrettyPrint<A> {
  print(value: A): string
}

export const durationPrettyPrint: PrettyPrint<Duration> = {
  print(duration: Duration): string {
    return `${duration.as("minutes")} minutes`
  },
}

export const dataSizePrettyPrint: PrettyPrint<number> = {
  print(data: number): string {
    return humanReadableSize(data)
  },
}

type RangeDisplayProps<A> = {
  readonly range: Range<A>
  readonly printer: PrettyPrint<A>
  readonly className?: string
}

function RangeDisplay<A>(props: RangeDisplayProps<A>) {
  return (
    <div className={props.className}>
      <span>{props.printer.print(props.range.min)}</span>
      <span> - </span>
      <span>{props.range.max.map(props.printer.print).getOrElse(() => "Max")}</span>
    </div>
  )
}

export default RangeDisplay