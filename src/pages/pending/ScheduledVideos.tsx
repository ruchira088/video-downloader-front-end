import React, {useEffect, useState} from "react"
import {Map} from "immutable"
import {Either, None} from "monet";
import ScheduledVideoDownload from "services/models/ScheduledVideoDownload";
import {fetchScheduledVideos, scheduledVideoDownloadStream} from "services/scheduling/SchedulingService";
import {EventStreamEventType} from "./EventStreamEventType";
import {parseScheduledVideoDownload} from "../../services/models/ResponseParser";
import ActiveDownload from "./ScheduledVideoDownloadCard";

export default () => {
    const [scheduledVideoDownloads, setScheduledVideoDownloads] = useState(Map<string, ScheduledVideoDownload>())

    useEffect(() => {
        fetchScheduledVideos(None(), 0, 100)
            .then(results => {
                    setScheduledVideoDownloads(scheduledVideoDownloads =>
                        results.reduce(
                            (videos, video) =>
                                videos.set(video.videoMetadata.id, video),
                            scheduledVideoDownloads
                        )
                    )
                }
            )
    }, [])

    useEffect(() => {
        const downloadStream = scheduledVideoDownloadStream()

        downloadStream.addEventListener(EventStreamEventType.ACTIVE_DOWNLOAD, messageEvent => {
            const {data} = messageEvent as unknown as { data: string }

            Either.fromTry(() => JSON.parse(data))
                .fold(
                    error => console.error(error),
                    json => {
                        const scheduledVideoDownload = parseScheduledVideoDownload(json)

                        setScheduledVideoDownloads(
                            scheduledVideoDownloads =>
                                scheduledVideoDownloads.set(
                                    scheduledVideoDownload.videoMetadata.id, scheduledVideoDownload
                                )
                        )
                    }
                )
        })

        return () => {
            downloadStream.removeEventListener(
                EventStreamEventType.ACTIVE_DOWNLOAD,
                (() => {}) as unknown as EventListener
            )
            downloadStream.close()
        }
    }, [])

    return (
        <>
            {
                scheduledVideoDownloads.valueSeq()
                    .map((scheduledVideoDownload, index) =>
                        <ActiveDownload {...scheduledVideoDownload} key={index}/>
                    )
            }
        </>
    )
}
