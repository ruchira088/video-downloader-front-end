import React, {useEffect, useState} from "react"
import {Map} from "immutable"
import ScheduledVideoDownload from "../../services/models/ScheduledVideoDownload";
import {active} from "../../services/scheduling/SchedulingService"
import {Either} from "monet";
import ActiveDownload from "./ActiveDownload";
import {EventStreamEventType} from "./EventStreamEventType";

export default () => {
    const [activeDownloads, setActiveDownloads] = useState(Map<string, ScheduledVideoDownload>())

    const handleActiveDownload =
        (scheduledVideoDownload: ScheduledVideoDownload) =>
            setActiveDownloads(active => active.set(scheduledVideoDownload.videoMetadata.id, scheduledVideoDownload))

    useEffect(() => {
            const activeDownloads = active()

            activeDownloads.addEventListener(EventStreamEventType.ACTIVE_DOWNLOAD, messageEvent => {
                const {data} = messageEvent as unknown as { data: string }

                Either.fromTry(() => JSON.parse(data))
                    .fold(
                        error => console.error(error),
                        (scheduledVideoDownload: ScheduledVideoDownload) =>
                            handleActiveDownload(scheduledVideoDownload)
                    )
            })

            return () => {
                activeDownloads.removeEventListener(EventStreamEventType.ACTIVE_DOWNLOAD, handleActiveDownload as unknown as EventListener)
                activeDownloads.close()
            }
        }, [])

    return (
        <div className="active-downloads">
            {activeDownloads.valueSeq().map((activeDownload, key) => <ActiveDownload {...activeDownload} key={key}/>)}
        </div>
    )
}
