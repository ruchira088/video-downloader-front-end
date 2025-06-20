import React, {type FC, useEffect, useState} from "react"
import {ScanStatus, VideoScan} from "~/models/VideoScan"
import {None, Option, Some} from "~/types/Option"
import {fetchVideoScanStatus, scanForVideos} from "~/services/video/VideoService"
import {Button} from "@mui/material"

type VideoScanButtonProps = {
  readonly className?: string
}

const VideoScanButton: FC<VideoScanButtonProps> = props => {
  const [scanStatus, setScanStatus] = useState<Option<ScanStatus>>(None.of())

  useEffect(() => {
    retrieveScanStatus()
  }, [])

  const isScanInProgress = scanStatus.map((status) => status === ScanStatus.InProgress).getOrElse(() => false)

  useEffect(() => {
    if (isScanInProgress) {
      const intervalId = setInterval(retrieveScanStatus, 1_000)

      return () => {
        clearInterval(intervalId)
      }
    }
  }, [isScanInProgress])

  const onClick = async () => {
    setScanStatus(Some.of(ScanStatus.InProgress))
    await scanForVideos()
  }

  const retrieveScanStatus = async () => {
    const videoScan: VideoScan = await fetchVideoScanStatus()
    setScanStatus(Some.of(videoScan.scanStatus))
  }

  const label = isScanInProgress ? "Scanning..." : "Scan For Videos"

  return (
    <Button variant="contained" disabled={isScanInProgress} onClick={onClick} className={props.className}>
      {label}
    </Button>
  )
}

export default VideoScanButton
