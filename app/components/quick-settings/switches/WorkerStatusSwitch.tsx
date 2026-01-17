import React, { useEffect, useState } from "react"
import { WorkerStatus } from "~/models/WorkerStatus"
import { fetchWorkerStatus, updateWorkerStatus } from "~/services/scheduling/SchedulingService"
import { IconButton, Tooltip } from "@mui/material"
import { PlayCircle, PauseCircle } from "@mui/icons-material"

const WorkerStatusSwitch = () => {
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null)

  useEffect(() => {
    fetchWorkerStatus().then((status) => setWorkerStatus(status))
  }, [])

  const onClick = async () => {
    if (workerStatus === null) return

    const updated: WorkerStatus = workerStatus === WorkerStatus.Available
      ? WorkerStatus.Paused
      : WorkerStatus.Available
    const existingValue = workerStatus
    setWorkerStatus(updated)

    try {
      await updateWorkerStatus(updated)
    } catch (e) {
      console.error(e)
      setWorkerStatus(existingValue)
    }
  }

  const isAvailable = workerStatus === WorkerStatus.Available

  return (
    <Tooltip title={isAvailable ? "Pause Workers" : "Start Workers"}>
      <span>
        <IconButton
          onClick={onClick}
          size="small"
          disabled={workerStatus === null}
          aria-label={isAvailable ? "Pause workers" : "Start workers"}
        >
          {isAvailable ? <PauseCircle /> : <PlayCircle />}
        </IconButton>
      </span>
    </Tooltip>
  )
}

export default WorkerStatusSwitch