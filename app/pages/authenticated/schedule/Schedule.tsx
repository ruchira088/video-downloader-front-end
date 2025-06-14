import React, {useState} from "react"
import {Button, LinearProgress, TextField} from "@mui/material"
import {scheduleVideo} from "~/services/scheduling/SchedulingService"
import Helmet from "~/components/helmet/Helmet"
import Preview from "~/components/schedule/preview/Preview"
import styles from "./Schedule.module.css"

const Schedule = () => {
  const [videoUrl, setVideoUrl] = useState("")
  const [isScheduling, setScheduling] = useState(false)

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => setVideoUrl(event.target.value)

  const onScheduleButtonClick = async () => {
    setScheduling(true)
    await scheduleVideo(videoUrl)
    setVideoUrl("")
    setScheduling(false)
  }

  return (
    <>
      <Helmet title="Schedule"/>
      <div className={styles.schedule}>
        <TextField onChange={handleTextChange} value={videoUrl} label="Website URL" className={styles.inputUrl} />
        <Button onClick={onScheduleButtonClick} variant="contained" color="primary" className={styles.scheduleButton}>
          Schedule Download
        </Button>
        {isScheduling && <LinearProgress className={styles.schedulingProgress} />}
        <Preview url={videoUrl} />
      </div>
    </>
  )
}

export default Schedule
