import React, { useEffect, useState } from "react"
import { Button } from "@mui/material"
import { WorkerStatus } from "~/models/WorkerStatus"
import { fetchWorkerStatus, updateWorkerStatus } from "~/services/scheduling/SchedulingService"
import { None, type Option, Some } from "~/types/Option"
import { useNotification } from "~/providers/NotificationProvider"
import { reportError } from "~/services/ErrorReporting"

// Pauses or resumes the download workers for every user. Admin only on the server.
const WorkerStatusButton = () => {
  // None until the current status has been fetched; the button is disabled in the meantime.
  const [workerStatus, setWorkerStatus] = useState<Option<WorkerStatus>>(None.of())
  const { notifyError } = useNotification()

  useEffect(() => {
    fetchWorkerStatus().then((status) => setWorkerStatus(Some.of(status))).catch((error) => reportError("Failed to fetch the worker status", error))
  }, [])

  const onClick = () =>
    void workerStatus.forEach(async (current) => {
      const updated = current === WorkerStatus.Available ? WorkerStatus.Paused : WorkerStatus.Available
      setWorkerStatus(Some.of(updated))

      try {
        await updateWorkerStatus(updated)
      } catch (error) {
        notifyError("Failed to update the worker status", error)
        setWorkerStatus(Some.of(current))
      }
    })

  const isPaused = workerStatus.toNullable() === WorkerStatus.Paused

  return (
    <Button
      variant="contained"
      color={isPaused ? "success" : "warning"}
      onClick={onClick}
      disabled={workerStatus.isEmpty()}
    >
      {isPaused ? "Resume Downloads" : "Pause Downloads"}
    </Button>
  )
}

export default WorkerStatusButton
