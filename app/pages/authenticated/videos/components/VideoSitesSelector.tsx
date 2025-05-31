import React, {type FC, useEffect, useState} from "react"
import {FormControl, InputLabel, MenuItem, Select} from "@mui/material"
import {videoServiceSummary} from "~/services/video/VideoService"

type VideoSitesSelectorProps = {
  readonly videoSites: string[]
  readonly onChange: (sites: string[]) => void
  readonly className?: string
}

const VideoSitesSelector: FC<VideoSitesSelectorProps> = props => {
  const [availableVideoSites, setAvailableVideoSites] = useState<string[]>([])

  useEffect(() => {
    videoServiceSummary().then((summary) => setAvailableVideoSites(summary.sites))
  }, [])

  return (
    <FormControl fullWidth className={props.className}>
      <InputLabel id="video-sites-selector-label">Sites</InputLabel>
      <Select
        multiple={true}
        id="video-sites-selector"
        labelId="video-sites-selector-label"
        label="Sites"
        onChange={(changeEvent) => props.onChange(changeEvent.target.value as string[])}
        value={props.videoSites}>
        {
          availableVideoSites
            .map((videoSite) => (
                <MenuItem key={videoSite} value={videoSite}>
                  {videoSite}
                </MenuItem>
              )
            )
        }
      </Select>
    </FormControl>

  )
}

export default VideoSitesSelector
