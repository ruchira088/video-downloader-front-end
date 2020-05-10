import React from "react"
import {humanReadableSize} from "utils/Formatter"

export interface ProgressValue {
    completeValue: number
    currentValue: number
}

export default (progressValue: ProgressValue) => {
    const percentage = (progressValue.currentValue / progressValue.completeValue * 100).toFixed(2)

    return (
        <div className="download-progress-bar">
            <div className="progress"/>
            <div>
                {percentage} %
            </div>
            <div>
                {humanReadableSize(progressValue.currentValue)} / {humanReadableSize(progressValue.completeValue)}
            </div>
        </div>
    )
}
