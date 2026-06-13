import React, {useState} from "react"
import {Button, LinearProgress, TextField} from "@mui/material"
import {scheduleVideo} from "~/services/scheduling/SchedulingService"
import Helmet from "~/components/helmet/Helmet"
import Preview from "~/components/schedule/preview/Preview"
import ErrorMessages from "~/components/error-messages/ErrorMessages"
import {extractErrorMessages} from "~/pages/unauthenticated/AuthFormHelpers"
import styles from "./Schedule.module.scss"

const Schedule = () => {
  const [videoUrl, setVideoUrl] = useState("")
  const [isScheduling, setScheduling] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrors([])
    setVideoUrl(event.target.value)
  }

  const onScheduleButtonClick = async () => {
    setScheduling(true)
    setErrors([])

    try {
      await scheduleVideo(videoUrl)
      setVideoUrl("")
    } catch (error: unknown) {
      setErrors(extractErrorMessages(error))
    } finally {
      setScheduling(false)
    }
  }

  return (
    <div className={styles.schedulePage}>
      <Helmet title="Schedule"/>
      <div className={styles.schedule}>
        <TextField onChange={handleTextChange} value={videoUrl} label="Website URL" className={styles.inputUrl} />
        <Button
          onClick={onScheduleButtonClick}
          disabled={isScheduling}
          variant="contained"
          color="primary"
          className={styles.scheduleButton}
        >
          Schedule Download
        </Button>
        {isScheduling && <LinearProgress className={styles.schedulingProgress} />}
        <ErrorMessages errors={errors} title="Scheduling failed" />
        <Preview url={videoUrl} />
      </div>
    </div>
  )
}

export default Schedule
