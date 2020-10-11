import React from "react"
import ScheduledVideoDownload from "models/ScheduledVideoDownload";
import {BytesPerSecond, Downloadable} from "../ScheduledVideos";
import {humanReadableDuration, humanReadableSize} from "utils/Formatter";
import moment from "moment";

export default (scheduledVideoDownload: ScheduledVideoDownload & Downloadable) =>
    scheduledVideoDownload.downloadSpeed
        .map((speed) =>
            <div>
                <div>{humanReadableSize(speed)}</div>
                <div>{remainingDuration(scheduledVideoDownload.videoMetadata.size, scheduledVideoDownload.downloadedBytes, speed)}</div>
            </div>
        )
        .orNull()

const remainingDuration =
    (totalSize: number, currentSize: number, downloadRate: BytesPerSecond): string =>
        humanReadableDuration(moment.duration((totalSize - currentSize)/downloadRate, "seconds"))
