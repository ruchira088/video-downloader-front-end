import React from "react"
import { SortBy } from "models/SortBy"
import { DurationRange, durationRangeNumberDecoder, durationRangeNumberEncoder } from "models/DurationRange"
import SortBySelection from "components/sort-by-selection/SortBySelection"
import { TextField } from "@mui/material"
import { duration } from "moment"
import { Maybe, NonEmptyList } from "monet"
import styles from "./VideoSearch.module.css"
import { Autocomplete } from '@mui/material';
import { List } from "immutable"
import Range from "models/Range"
import { maybeString } from "utils/StringUtils"
import RangeSlider from "./RangeSlider"
import VideoSitesSelector from "./VideoSitesSelector"
import { codec, identityCodec } from "models/Codec"
import { dataSizePrettyPrint, durationPrettyPrint } from "./RangeDisplay"

const MAX_RANGE = duration(75, "minutes")
const MAX_DATA_SIZE = 2000000000

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
  isLoading: boolean
}) => (
  <div className={styles.videoFilter}>
    <div className={styles.left}>
      <Autocomplete
        freeSolo
        inputValue={searchTerm.getOrElse("")}
        onInputChange={(changeEvent, value) =>
          Maybe.fromNull(changeEvent).forEach(() => onSearchTermChange(maybeString(value)))
        }
        options={videoTitles.toArray()}
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