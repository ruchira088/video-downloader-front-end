import React, { useState } from "react"
import { SortBy } from "models/SortBy"
import { DurationRange, toNumberRange } from "models/DurationRange"
import SortBySelection from "components/sort-by-selection/SortBySelection"
import { Slider } from "@material-ui/core"
import { duration } from "moment"
import { Maybe } from "monet"
import DurationRangeDisplay from "./DurationRangeDisplay"
import styles from "./VideoFilter.module.css"

const MAX_RANGE = duration(75, "minutes")

const fromChangeEvent = (value: number | number[]): DurationRange => {
  const [min, max] = ([] as number[]).concat(value)
  return {
    min: duration(Maybe.fromFalsy(min).getOrElse(0), "minutes"),
    max: Maybe.fromFalsy(max)
      .map((minutes) => duration(minutes, "minutes"))
      .filter((value) => value.asMinutes() < MAX_RANGE.asMinutes()),
  }
}

export default ({
  sortBy,
  onSortByChange,
  durationRange,
  onDurationRangeChange,
}: {
  sortBy: SortBy
  onSortByChange: (sortBy: SortBy) => void
  durationRange: DurationRange
  onDurationRangeChange: (durationRange: DurationRange) => void
}) => {
  const [transientDurationRange, setTransientDurationRange] = useState(durationRange)

  return (
    <div className={styles.videoFilter}>
      <SortBySelection value={sortBy} onChange={onSortByChange} />
      <Slider
        max={MAX_RANGE.asMinutes()}
        value={toNumberRange(transientDurationRange, MAX_RANGE)}
        onChange={(event, value) => setTransientDurationRange(fromChangeEvent(value))}
        onChangeCommitted={(event, value) => onDurationRangeChange(fromChangeEvent(value))}
      />
      <DurationRangeDisplay durationRange={transientDurationRange} />
    </div>
  )
}
