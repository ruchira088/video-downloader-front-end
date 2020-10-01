import React, {useEffect, useState} from "react"
import {Either, Maybe, None} from "monet";
import {
    fetchScheduledVideoById,
    fetchScheduledVideos,
    scheduledVideoDownloadStream
} from "services/scheduling/SchedulingService";
import {EventStreamEventType} from "./EventStreamEventType";
import ScheduledVideoDownloadCard from "./scheduled-video-download-card/ScheduledVideoDownloadCard";
import ScheduledVideoDownload from "models/ScheduledVideoDownload";

type Map<V> = { [key: string]: V }

interface DownloadProgress {
    readonly videoId: string
    readonly updatedAt: string
    readonly bytes: number
}

export default () => {
    const [scheduledVideoDownloads, setScheduledVideoDownloads] = useState<Map<ScheduledVideoDownload>>({})

    useEffect(() => {
        fetchScheduledVideos(None(), 0, 100)
            .then(results =>
                setScheduledVideoDownloads(
                    scheduledVideoDownloads =>
                        results.reduce<Map<ScheduledVideoDownload>>((output, scheduledVideoDownload) => ({
                            ...output,
                            [scheduledVideoDownload.videoMetadata.id]: scheduledVideoDownload
                        }), scheduledVideoDownloads)
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

                        Maybe.fromNull(scheduledVideoDownloads[downloadProgress.videoId])
                            .map(value => Promise.resolve(value))
                            .orLazy(() => fetchScheduledVideoById(downloadProgress.videoId))
                            .then(scheduledVideoDownload => {
                                    setScheduledVideoDownloads(
                                        scheduledVideoDownloads => ({...scheduledVideoDownloads,
                                            [scheduledVideoDownload.videoMetadata.id]: {
                                                ...scheduledVideoDownload,
                                                downloadedBytes: downloadProgress.bytes
                                            }
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
    })

    return (
        <>
            {
                Object.values<ScheduledVideoDownload>(scheduledVideoDownloads)
                    .map((scheduledVideoDownload, index) =>
                        <ScheduledVideoDownloadCard {...scheduledVideoDownload} key={index}/>
                    )
            }
        </>
    )
}
