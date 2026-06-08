import React, { useEffect, useState } from "react"
import { WorkerStatus } from "~/models/WorkerStatus"
import { fetchWorkerStatus, updateWorkerStatus } from "~/services/scheduling/SchedulingService"
import { PlayCircle, PauseCircle } from "@mui/icons-material"
import QuickSettingsButton from "./QuickSettingsButton"

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
    <QuickSettingsButton
      tooltip={isAvailable ? "Pause Workers" : "Start Workers"}
      ariaLabel={isAvailable ? "Pause workers" : "Start workers"}
      icon={isAvailable ? <PauseCircle /> : <PlayCircle />}
      onClick={onClick}
      disabled={workerStatus === null}
    />
  )
}

export default WorkerStatusSwitch
