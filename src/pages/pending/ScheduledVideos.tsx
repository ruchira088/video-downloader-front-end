import React, {useEffect, useState} from "react"
import {Map} from "immutable"
import {Either, None} from "monet";
import {
    fetchScheduledVideos,
    ScheduledVideoDownloadJson,
    scheduledVideoDownloadStream
} from "services/scheduling/SchedulingService";
import {EventStreamEventType} from "./EventStreamEventType";
import {parseScheduledVideoDownload} from "../../services/models/ResponseParser";
import ScheduledVideoDownloadCard from "./scheduled-video-download-card/ScheduledVideoDownloadCard";

export default () => {
    const [scheduledVideoDownloadJsons, setScheduledVideoDownloadJsons] = useState(Map<string, ScheduledVideoDownloadJson>())

    useEffect(() => {
        fetchScheduledVideos(None(), 0, 100)
            .then(results =>
                setScheduledVideoDownloadJsons(
                    scheduledVideoDownloadJsons =>
                        results.reduce<Map<string, ScheduledVideoDownloadJson>>(
                            (scheduledVideoDownloads, scheduledVideoDownload) =>
                                scheduledVideoDownloads.set((scheduledVideoDownload as any).videoMetadata.id, scheduledVideoDownload),
                            scheduledVideoDownloadJsons
                        )
                )
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
                        setScheduledVideoDownloadJsons(
                            scheduledVideoDownloadJsons =>
                                scheduledVideoDownloadJsons.set(
                                    json.videoMetadata.id, json
                                )
                        )
                    }
                )
        })

        return () => {
            downloadStream.removeEventListener(
                EventStreamEventType.ACTIVE_DOWNLOAD,
                (() => {
                }) as unknown as EventListener
            )
            downloadStream.close()
        }
    }, [])

    return (
        <>
            {
                scheduledVideoDownloadJsons.valueSeq().map(parseScheduledVideoDownload)
                    .map((scheduledVideoDownload, index) =>
                        <ScheduledVideoDownloadCard {...scheduledVideoDownload} key={index}/>
                    )
            }
        </>
    )
}
