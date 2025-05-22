import React from "react"
import { SortBy } from "~/models/SortBy"
import { type DurationRange, durationRangeNumberDecoder, durationRangeNumberEncoder } from "~/models/DurationRange"
import SortBySelection from "~/components/sort-by-selection/SortBySelection"
import { Autocomplete, TextField } from "@mui/material"
import { type Range } from "~/models/Range"
import { maybeString } from "~/utils/StringUtils"
import RangeSlider from "./RangeSlider"
import VideoSitesSelector from "./VideoSitesSelector"
import { codec, identityCodec } from "~/models/Codec"
import { dataSizePrettyPrint, durationPrettyPrint } from "./RangeDisplay"
import { Duration } from "luxon"

import styles from "./VideoSearch.module.css"
import { Option } from "~/types/Option"

const MAX_RANGE = Duration.fromObject({minutes: 75})
const MAX_DATA_SIZE = 10_000_000_000

const VideoSearch = ({
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
  onVideoSitesChange,
  isLoading,
}: {
  videoTitles: string[]
  searchTerm: Option<string>
  onSearchTermChange: (searchTerm: Option<string>) => void
  sortBy: SortBy
  onSortByChange: (sortBy: SortBy) => void
  durationRange: DurationRange
  onDurationRangeChange: (durationRange: DurationRange) => void
  sizeRange: Range<number>
  onSizeRangeChange: (sizeRange: Range<number>) => void
  videoSites: string[]
  onVideoSitesChange: (videoSites: string[]) => void
  isLoading: boolean
}) => (
  <div className={styles.videoFilter}>
    <div className={styles.left}>
      <Autocomplete
        freeSolo
        inputValue={searchTerm.getOrElse(() => "")}
        onInputChange={(changeEvent, value) =>
          Option.fromNullable(changeEvent).forEach(() => onSearchTermChange(maybeString(value)))
        }
        options={videoTitles}
        renderInput={(params) => <TextField {...params} label="Search" />}
        loading={isLoading}
        className={styles.search}
      />
      <div className={styles.selectors}>
        <VideoSitesSelector
          videoSites={videoSites}
          onChange={onVideoSitesChange}
          className={styles.videoSiteSelector}
        />
        <SortBySelection value={sortBy} onChange={onSortByChange} className={styles.sortBy} />
      </div>
    </div>

    <div className={styles.right}>
      <RangeSlider
        title="Duration"
        range={durationRange}
        onChange={onDurationRangeChange}
        maxValue={MAX_RANGE}
        codec={codec(durationRangeNumberEncoder, durationRangeNumberDecoder)}
        printer={durationPrettyPrint}
      />
      <RangeSlider
        title="Size"
        range={sizeRange}
        onChange={onSizeRangeChange}
        maxValue={MAX_DATA_SIZE}
        codec={identityCodec()}
        printer={dataSizePrettyPrint}
      />
    </div>
  </div>
)

export default VideoSearch