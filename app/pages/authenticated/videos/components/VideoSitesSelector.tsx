import React, { type JSX, useEffect, useState } from "react"
import { MenuItem, Select } from "@mui/material"
import { videoServiceSummary } from "~/services/video/VideoService"

const VideoSelector = (props: {
  videoSites: string[]
  onChange: (sites: string[]) => void
  className?: string
}): JSX.Element => {
  const [availableVideoSites, setAvailableVideoSites] = useState<string[]>([])

  useEffect(() => {
    videoServiceSummary().then((summary) => setAvailableVideoSites(summary.sites))
  }, [])

  return (
    <Select
      multiple={true}
      onChange={(changeEvent) => props.onChange(changeEvent.target.value as string[])}
      value={props.videoSites}
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
