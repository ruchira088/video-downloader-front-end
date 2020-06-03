import React, {useState} from "react"
import {Button, TextField} from "@material-ui/core"
import {scheduleVideo} from "services/scheduling/SchedulingService"
import Preview from "./Preview";

export default () => {
    const [videoUrl, setVideoUrl] = useState(String())
    const [scheduling, setScheduling] = useState(false)

    const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => setVideoUrl(event.target.value)

    const onScheduleButtonClick =
        () => {
            setScheduling(true)
            scheduleVideo(videoUrl).then(() => {
                setVideoUrl(String())
                setScheduling(false)
            })
        }

    return (
        <div className="schedule-video">
            <TextField onChange={handleTextChange} value={videoUrl} label="Website URL"/>
            <Button onClick={onScheduleButtonClick} variant="contained" color="primary">Schedule Download</Button>
            <Preview url={videoUrl}/>
        </div>
    )
}
