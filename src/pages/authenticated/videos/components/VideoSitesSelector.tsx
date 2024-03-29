import React, { useEffect, useState } from "react"
import { Maybe, NonEmptyList } from "monet"
import { MenuItem, Select } from "@mui/material"
import { videoServiceSummary } from "services/video/VideoService"

const VideoSelector = (props: {
  videoSites: Maybe<NonEmptyList<string>>
  onChange: (values: Maybe<NonEmptyList<string>>) => void
  className?: string
}): JSX.Element => {
  const [availableVideoSites, setAvailableVideoSites] = useState<string[]>([])

  useEffect(() => {
    videoServiceSummary().then((summary) => setAvailableVideoSites(summary.sites))
  }, [])

  return (
    <Select
      multiple={true}
      onChange={(changeEvent) => props.onChange(NonEmptyList.from(changeEvent.target.value as string[]))}
      value={
        availableVideoSites.length === 0
          ? []
          : props.videoSites.map((nonEmptyList) => nonEmptyList.toArray()).getOrElse([])
      }
      className={props.className}
    >
      {availableVideoSites.map((videoSite) => (
        <MenuItem key={videoSite} value={videoSite}>
          {videoSite}
        </MenuItem>
      ))}
    </Select>
  )
}

export default VideoSelector
