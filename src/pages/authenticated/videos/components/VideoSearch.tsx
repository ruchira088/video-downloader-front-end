import React, { useState } from "react"
import { SortBy } from "models/SortBy"
import { DurationRange, durationRangeNumberEncoder } from "models/DurationRange"
import SortBySelection from "components/sort-by-selection/SortBySelection"
import { Slider, TextField } from "@material-ui/core"
import { duration } from "moment"
import { Maybe, NonEmptyList } from "monet"
import DurationRangeDisplay from "./DurationRangeDisplay"
import styles from "./VideoSearch.module.css"
import { Autocomplete } from "@material-ui/lab"
import { List } from "immutable"
import { Range, toNumberArray } from "models/Range"
import { maybeString } from "utils/StringUtils"

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
  videoTitles,
  searchTerm,
  onSearchTermChange,
  sortBy,
  onSortByChange,
  durationRange,
  onDurationRangeChange,
  sizeRange,
  onSizeRangeChange,
  videoSites,
  onVideoSitesChange
}: {
  videoTitles: List<string>
  searchTerm: Maybe<string>
  onSearchTermChange: (searchTerm: Maybe<string>) => void
  sortBy: SortBy
  onSortByChange: (sortBy: SortBy) => void
  durationRange: DurationRange
  onDurationRangeChange: (durationRange: DurationRange) => void
  sizeRange: Range<number>
  onSizeRangeChange: (sizeRange: Range<number>) => void
  videoSites: Maybe<NonEmptyList<string>>
  onVideoSitesChange: (videoSites: Maybe<NonEmptyList<string>>) => void
}) => {
  const [transientDurationRange, setTransientDurationRange] = useState(durationRange)
  const [transientSizeRange, setTransientSizeRange] = useState(sizeRange)

  return (
    <div className={styles.videoFilter}>
      <Autocomplete
        freeSolo
        inputValue={searchTerm.getOrElse("")}
        onInputChange={(changeEvent, value) =>
          Maybe.fromNull(changeEvent).forEach(() => onSearchTermChange(maybeString(value)))
        }
        options={videoTitles.toArray()}
        renderInput={(params) => <TextField {...params} />}
      />
      <SortBySelection value={sortBy} onChange={onSortByChange} />
      <Slider
        max={MAX_RANGE.asMinutes()}
        value={toNumberArray(transientDurationRange, MAX_RANGE, durationRangeNumberEncoder)}
        onChange={(event, value) => setTransientDurationRange(fromChangeEvent(value))}
        onChangeCommitted={(event, value) => onDurationRangeChange(fromChangeEvent(value))}
      />
      <DurationRangeDisplay durationRange={transientDurationRange} />
    </div>
  )
}
