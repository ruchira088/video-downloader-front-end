import React, {useState} from "react"
import {Button, LinearProgress, TextField} from "@mui/material"
import {scheduleVideo} from "~/services/scheduling/SchedulingService"
import Helmet from "~/components/helmet/Helmet"
import Preview from "~/components/schedule/preview/Preview"
import ErrorMessages from "~/components/error-messages/ErrorMessages"
import {extractErrorMessages} from "~/pages/unauthenticated/AuthFormHelpers"
import {useNotification} from "~/providers/NotificationProvider"
import {Either} from "~/types/Either"
import styles from "./Schedule.module.scss"

const isHttpUrl = (value: string): boolean =>
  !Either.fromTry(() => new URL(value))
    .toOption()
    .filter((url) => url.protocol === "http:" || url.protocol === "https:")
    .isEmpty()

const Schedule = () => {
  const {notifySuccess} = useNotification()
  const [videoUrl, setVideoUrl] = useState("")
  const [isScheduling, setScheduling] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const trimmedUrl = videoUrl.trim()

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrors([])
    setVideoUrl(event.target.value)
  }

  // A form rather than a bare button, so Enter submits the way it does in every other field.
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isScheduling) return

    if (!isHttpUrl(trimmedUrl)) {
      setErrors(["Enter a valid http:// or https:// URL"])
      return
    }

    setScheduling(true)
    setErrors([])

    try {
      await scheduleVideo(trimmedUrl)
      setVideoUrl("")
      notifySuccess("Download scheduled")
    } catch (error: unknown) {
      setErrors(extractErrorMessages(error))
    } finally {
      setScheduling(false)
    }
  }

  return (
    <div className={styles.schedulePage}>
      <Helmet title="Schedule"/>
      <form className={styles.schedule} onSubmit={onSubmit} noValidate>
        <TextField
          onChange={handleTextChange}
          value={videoUrl}
          label="Website URL"
          name="url"
          type="url"
          className={styles.inputUrl}
        />
        <Button
          type="submit"
          disabled={isScheduling || trimmedUrl.length === 0}
          variant="contained"
          color="primary"
          className={styles.scheduleButton}
        >
          Schedule Download
        </Button>
        {isScheduling && <LinearProgress className={styles.schedulingProgress} />}
        <ErrorMessages errors={errors} title="Scheduling failed" />
        <Preview url={videoUrl} />
      </form>
    </div>
  )
}

export default Schedule
