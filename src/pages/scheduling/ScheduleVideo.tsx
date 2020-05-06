import React, {useState} from "react"
import {scheduleVideo} from "../../services/scheduling/SchedulingService"
import ScheduledVideoDownload from "../../services/models/ScheduledVideoDownload";

export default () => {
    const [videoUrl, setVideoUrl] = useState(String())

    const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => setVideoUrl(event.target.value)

    const onScheduleButtonClick: () => Promise<ScheduledVideoDownload> = () => scheduleVideo(videoUrl)

    return (
        <div className="schedule-video">
            <input onChange={handleTextChange} value={videoUrl}/>
            <button onClick={onScheduleButtonClick}>Schedule</button>
        </div>
    )
}
