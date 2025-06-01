import React from "react"
import { LinearProgress } from "@mui/material"
import { humanReadableSize } from "~/utils/Formatter"

import styles from "./DownloadProgress.module.scss"

export interface ProgressValue {
  readonly completeValue: number
  readonly currentValue: number
}

const DownloadProgress = (progressValue: ProgressValue) => {
  const percentage = Number(((progressValue.currentValue / progressValue.completeValue) * 100).toFixed(2))

  return (
    <div className={styles.downloadProgress}>
      <div className={styles.details}>
        <div className={styles.percentage}>{Number.isNaN(percentage) ? "" : `${percentage} %` }</div>
        <div className={styles.absolute}>
          {humanReadableSize(progressValue.currentValue)} / {humanReadableSize(progressValue.completeValue)}
        </div>
      </div>
      <LinearProgress variant="determinate" value={percentage} />
    </div>
  )
}

export default DownloadProgress
