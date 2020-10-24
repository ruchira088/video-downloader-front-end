import React from "react"
import { DurationRange } from "models/DurationRange"

export default ({ durationRange }: { durationRange: DurationRange }) => (
  <div>
    <span>{`${durationRange.min.asMinutes()} minutes`}</span>
    <span> - </span>
    <span>{durationRange.max.map((duration) => `${duration.asMinutes()} minutes`).getOrElse("Max")}</span>
  </div>
)
