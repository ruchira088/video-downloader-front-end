import React, {useEffect, useState} from "react"
import { Map } from "immutable"
import ScheduledVideoDownload from "../../services/models/ScheduledVideoDownload";
import {active} from "../../services/scheduling/SchedulingService"
import {Either} from "monet";

export default () => {
    const [activeDownloads, setActiveDownloads] = useState(Map<string, ScheduledVideoDownload>())

    useEffect(() => {
        const activeDownloads = active()

        activeDownloads.onmessage =
            ({data}) =>
                Either.fromTry(() => JSON.parse(data))
                    .fold(
                        () => {},
                            scheduledVideoDownload => {
                                setActiveDownloads(activeDownloads => activeDownloads.set(scheduledVideoDownload.videoMetadata.key, scheduledVideoDownload))
                            }
                    )

        return () => activeDownloads.close()
    }, [])

    return (
        <div className="active-downloads">
            { activeDownloads.valueSeq().map(value => value.downloadedBytes).join(",") }
        </div>
    )
}
