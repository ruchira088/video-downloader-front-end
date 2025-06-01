import React from "react"
import {SortBy} from "~/models/SortBy"
import {type DurationRange, durationRangeNumberDecoder, durationRangeNumberEncoder} from "~/models/DurationRange"
import SortBySelection from "~/components/sort-by-selection/SortBySelection"
import {Autocomplete, TextField} from "@mui/material"
import {type Range} from "~/models/Range"
import {maybeString} from "~/utils/StringUtils"
import RangeSlider from "./RangeSlider"
import VideoSitesSelector from "./VideoSitesSelector"
import {codec, identityCodec} from "~/models/Codec"
import {dataSizePrettyPrint, durationPrettyPrint} from "./RangeDisplay"
import {Duration} from "luxon"

import styles from "./VideoSearch.module.scss"
import {Option} from "~/types/Option"
import type {Ordering} from "~/models/Ordering"
import OrderingComponent from "~/components/ordering/OrderingComponent"

const MAX_RANGE = Duration.fromObject({minutes: 75})
const MAX_DATA_SIZE = 10_000_000_000

type VideoSearchProps = {
  readonly videoTitles: string[]
  readonly searchTerm: Option<string>
  readonly onSearchTermChange: (searchTerm: Option<string>) => void
  readonly sortBy: SortBy
  readonly onSortByChange: (sortBy: SortBy) => void
  readonly durationRange: DurationRange
  readonly onDurationRangeChange: (durationRange: DurationRange) => void
  readonly sizeRange: Range<number>
  readonly onSizeRangeChange: (sizeRange: Range<number>) => void
  readonly videoSites: string[]
  readonly onVideoSitesChange: (videoSites: string[]) => void
  readonly ordering: Ordering
  readonly onOrderingChange: (ordering: Ordering) => void
  readonly isLoading: boolean
}

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
  ordering,
  onOrderingChange,
  isLoading,
}: VideoSearchProps) => (
  <div className={styles.videoSearch}>
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
        <VideoSitesSelector videoSites={videoSites} onChange={onVideoSitesChange} className={styles.videoSiteSelector}/>
        <SortBySelection sortBy={sortBy} onChange={onSortByChange} className={styles.sortBy}/>
        <OrderingComponent ordering={ordering} onOrderingChange={onOrderingChange} className={styles.ordering}/>
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