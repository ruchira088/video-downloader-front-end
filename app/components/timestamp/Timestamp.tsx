import React, { type FC } from "react"
import { DateTime, type DateTimeFormatOptions } from "luxon"

type TimestampProps = {
  readonly timestamp: DateTime
  readonly currentTimestamp?: DateTime
  readonly format?: DateTimeFormatOptions
  readonly className?: string
  readonly prefix?: string
}

const Timestamp: FC<TimestampProps> = props => {
  const format: DateTimeFormatOptions = props.format ?? DateTime.DATETIME_MED
  const currentDateTime = props.currentTimestamp ?? DateTime.now()

  return (
    <div className={props.className}>
      {props.prefix && <span>{props.prefix} </span>}
      {props.timestamp.toLocaleString(format)} ({props.timestamp.toRelative({ base: currentDateTime })})
    </div>
  )
}

export default Timestamp