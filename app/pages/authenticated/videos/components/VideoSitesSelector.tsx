import React, {type FC, useEffect, useState} from "react"
import {Box, Checkbox, Chip, FormControl, InputLabel, ListItemText, MenuItem, Select} from "@mui/material"
import {videoServiceSummary} from "~/services/video/VideoService"

import styles from "./VideoSitesSelector.module.scss"

const menuProps = {
  PaperProps: {
    style: {
      maxHeight: 256,
      width: 250
    }
  }
}

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
    <FormControl fullWidth size="small" className={props.className}>
      <InputLabel id="video-sites-selector-label">Sites</InputLabel>
      <Select<string[]>
        size="small"
        multiple={true}
        id="video-sites-selector"
        labelId="video-sites-selector-label"
        label="Sites"
        onChange={(changeEvent) => props.onChange(changeEvent.target.value as string[])}
        renderValue={(selected) => <SelectedSites sites={selected}/>}
        value={props.videoSites}
        MenuProps={menuProps}
      >
        {
          availableVideoSites
            .map((videoSite) => (
                <MenuItem key={videoSite} value={videoSite} className={styles.menuItem}>
                  <Checkbox checked={props.videoSites.includes(videoSite)}/>
                  <ListItemText primary={videoSite}/>
                </MenuItem>
              )
            )
        }
      </Select>
    </FormControl>

  )
}

type SelectedSitesProps = {
  readonly sites: string[]
  readonly className?: string
}

const SelectedSites: FC<SelectedSitesProps> = props =>
  <Box>
    {props.sites.map((site) =>
      <Chip key={site} label={site}/>
    )
    }
  </Box>

export default VideoSitesSelector
