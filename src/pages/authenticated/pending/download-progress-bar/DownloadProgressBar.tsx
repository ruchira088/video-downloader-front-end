import React from "react"
import { Line } from "rc-progress"
import { humanReadableSize } from "utils/Formatter"

export interface ProgressValue {
  readonly completeValue: number
  readonly currentValue: number
}

const DownloadProgressBar = (progressValue: ProgressValue) => {
  const percentage = Number(((progressValue.currentValue / progressValue.completeValue) * 100).toFixed(2))

  return (
    <div className="download-progress-bar">
      <div className="progress" />
      <div>{percentage} %</div>
      <div>
        {humanReadableSize(progressValue.currentValue)} / {humanReadableSize(progressValue.completeValue)}
      </div>
      <Line percent={percentage} />
    </div>
  )
}

export default DownloadProgressBar
