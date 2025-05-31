import React from "react"
import { LinearProgress } from "@mui/material"
import { humanReadableSize } from "~/utils/Formatter"

export interface ProgressValue {
  readonly completeValue: number
  readonly currentValue: number
}

const DownloadProgressBar = (progressValue: ProgressValue) => {
  const percentage = Number(((progressValue.currentValue / progressValue.completeValue) * 100).toFixed(2))

  return (
    <div>
      <div>{percentage} %</div>
      <div>
        {humanReadableSize(progressValue.currentValue)} / {humanReadableSize(progressValue.completeValue)}
      </div>
      <LinearProgress variant="determinate" value={percentage} />
    </div>
  )
}

export default DownloadProgressBar
