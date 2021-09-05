import React from "react"
import { SortBy } from "models/SortBy"
import { DurationRange, durationRangeNumberDecoder, durationRangeNumberEncoder } from "models/DurationRange"
import SortBySelection from "components/sort-by-selection/SortBySelection"
import { TextField } from "@material-ui/core"
import { duration } from "moment"
import { Maybe, NonEmptyList } from "monet"
import styles from "./VideoSearch.module.css"
import { Autocomplete } from "@material-ui/lab"
import { List } from "immutable"
import Range from "models/Range"
import { maybeString } from "utils/StringUtils"
import RangeSlider from "./RangeSlider"
import VideoSitesSelector from "./VideoSitesSelector"
import { codec, identityCodec } from "models/Codec"
import { dataSizePrettyPrint, durationPrettyPrint } from "./RangeDisplay"

const MAX_RANGE = duration(75, "minutes")
const MAX_DATA_SIZE = 4000

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
}) =>
  (
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
      <RangeSlider
        range={durationRange}
        onChange={onDurationRangeChange}
        maxValue={MAX_RANGE}
        codec={codec(durationRangeNumberEncoder, durationRangeNumberDecoder)}
        printer={durationPrettyPrint} />
      <RangeSlider
        range={sizeRange}
        onChange={onSizeRangeChange}
        maxValue={MAX_DATA_SIZE}
        codec={identityCodec()}
        printer={dataSizePrettyPrint} />
      <VideoSitesSelector videoSites={videoSites} onChange={onVideoSitesChange}/>
    </div>
  )
