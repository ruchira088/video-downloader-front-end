import React, { useState } from "react"
import { Button, TextField } from "@mui/material"
import { scheduleVideo } from "services/scheduling/SchedulingService"
import Preview from "components/schedule/preview/Preview"
import styles from "./Schedule.module.css"
import { LoadingComponent } from "components/hoc/loading/loadableComponent"
import { Helmet } from "react-helmet"

const Schedule = () => {
  const [videoUrl, setVideoUrl] = useState(String())
  const [scheduling, setScheduling] = useState(false)

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => setVideoUrl(event.target.value)

  const onScheduleButtonClick = () => {
    setScheduling(true)
    scheduleVideo(videoUrl).then(() => {
      setVideoUrl(String())
      setScheduling(false)
    })
  }

  return (
    <>
      <Helmet>
        <title>Schedule</title>
      </Helmet>
      <div className={styles.schedule}>
        <TextField onChange={handleTextChange} value={videoUrl} label="Website URL" className={styles.inputUrl} />
        <Button onClick={onScheduleButtonClick} variant="contained" color="primary">
          Schedule Download
        </Button>
      </div>
      <Preview url={videoUrl} />
      {scheduling && <LoadingComponent />}
    </>
  )
}

export default Schedule
