import React, {useState, useEffect} from "react"
import {Maybe, None, Some} from "monet";
import ScheduledVideoDownload from "services/models/ScheduledVideoDownload";
import loadableComponent from "components/hoc/loadableComponent";
import {fetchScheduledVideos} from "services/scheduling/SchedulingService";

interface ScheduledVideos {
    results: ScheduledVideoDownload[]
}

const ScheduleVideosContainer: React.ComponentType<ScheduledVideos> =
    (scheduledVideos: ScheduledVideos) => (
        <div>

        </div>
    )

export default () => {
    const [scheduledVideos, setScheduledVideos] = useState<Maybe<ScheduledVideos>>(None())

    useEffect(() => {
        fetchScheduledVideos(None(), 100, 0)
            .then(results => setScheduledVideos(Some({ results })))
    }, [])

    return (
        <div className="scheduled-videos">
            { loadableComponent(ScheduleVideosContainer, scheduledVideos) }
        </div>
    )
}
