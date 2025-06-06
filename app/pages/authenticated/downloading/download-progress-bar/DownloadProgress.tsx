import React, {type FC} from "react"
import { LinearProgress } from "@mui/material"
import { humanReadableSize } from "~/utils/Formatter"

import styles from "./DownloadProgress.module.scss"
import {Option} from "~/types/Option"
import {SchedulingStatus} from "~/models/SchedulingStatus"

export interface ProgressValue {
  readonly completeValue: number
  readonly currentValue: number
  readonly schedulingStatus: SchedulingStatus
}

const DownloadProgress: FC<ProgressValue> = ({completeValue, currentValue, schedulingStatus}) => {
  const maybePercentage: Option<number> =
    Option.fromNullable(completeValue)
      .filter(completeValue => completeValue > 0 && currentValue > 0)
      .map(completeValue => Number(((currentValue / completeValue) * 100).toFixed(2)))

  return (
    <div className={styles.downloadProgress}>
      <div className={styles.details}>
        { maybePercentage.map(percentage => <div className={styles.percentage}>{percentage} %</div>).toNullable() }
        <div className={styles.absolute}>
          {humanReadableSize(currentValue)} / {humanReadableSize(completeValue)}
        </div>
      </div>
      {
        maybePercentage.fold(
          () => schedulingStatus === SchedulingStatus.Active ? <LinearProgress /> : null,
          percentage => <LinearProgress variant="determinate" value={percentage} />
        )
      }

    </div>
  )
}

export default DownloadProgress
