import React, {useEffect, useState} from "react"
import {Either, None} from "monet";
import {Map} from "immutable"
import {
    fetchScheduledVideoById,
    fetchScheduledVideos,
    scheduledVideoDownloadStream
} from "services/scheduling/SchedulingService";
import {EventStreamEventType} from "./EventStreamEventType";
import ScheduledVideoDownloadCard from "./scheduled-video-download-card/ScheduledVideoDownloadCard";
import ScheduledVideoDownload from "models/ScheduledVideoDownload";

interface DownloadProgress {
    readonly videoId: string
    readonly updatedAt: string
    readonly bytes: number
}

export default () => {
    const [scheduledVideoDownloads, setScheduledVideoDownloads] = useState<Map<string, ScheduledVideoDownload>>(Map())

    useEffect(() => {
        fetchScheduledVideos(None(), 0, 100)
            .then(results =>
                setScheduledVideoDownloads(
                    scheduledVideoDownloads =>
                        scheduledVideoDownloads.concat(Map(results.map(scheduledVideoDownload => [scheduledVideoDownload.videoMetadata.id, scheduledVideoDownload])))
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
                        const downloadProgress = json as DownloadProgress

                        fetchScheduledVideoById(downloadProgress.videoId)
                            .then(scheduledVideoDownload => {
                                    setScheduledVideoDownloads(
                                        scheduledVideoDownloads =>
                                            scheduledVideoDownloads.set(scheduledVideoDownload.videoMetadata.id, {
                                                ...scheduledVideoDownload,
                                                downloadedBytes: downloadProgress.bytes
                                            })
                                    )
                                }
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
                scheduledVideoDownloads.map((scheduledVideoDownload, index) =>
                    <ScheduledVideoDownloadCard {...scheduledVideoDownload} key={index}/>
                )
                    .toList()
            }
        </>
    )
}
