import React, { type JSX } from "react"
import { Range } from "~/models/Range"
import { Duration } from "luxon"
import { humanReadableSize } from "~/utils/Formatter"
import { Option } from "~/types/Option"

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

const RangeDisplay = <A extends {}>(props: RangeDisplayProps<A>): JSX.Element => (
    <div className={props.className}>
      <span>{props.printer.print(props.range.min)}</span>
      <span> - </span>
      <span>{Option.fromNullable(props.range.max).map(props.printer.print).getOrElse(() => "Max")}</span>
    </div>
  )

export default RangeDisplay