import React, { useEffect, useState } from "react"
import { WorkerStatus } from "~/models/WorkerStatus"
import { fetchWorkerStatus, updateWorkerStatus } from "~/services/scheduling/SchedulingService"
import { PlayCircle, PauseCircle } from "@mui/icons-material"
import QuickSettingsButton from "./QuickSettingsButton"
import { None, type Option, Some } from "~/types/Option"

const WorkerStatusSwitch = () => {
  // None until the current status has been fetched; the button is disabled in the meantime.
  const [workerStatus, setWorkerStatus] = useState<Option<WorkerStatus>>(None.of())

  useEffect(() => {
    fetchWorkerStatus().then((status) => setWorkerStatus(Some.of(status))).catch(console.error)
  }, [])

  const onClick = () =>
    void workerStatus.forEach(async (current) => {
      const updated = current === WorkerStatus.Available ? WorkerStatus.Paused : WorkerStatus.Available
      setWorkerStatus(Some.of(updated))

      try {
        await updateWorkerStatus(updated)
      } catch (error) {
        console.error(error)
        setWorkerStatus(Some.of(current))
      }
    })

  const isAvailable = workerStatus.toNullable() === WorkerStatus.Available

  return (
    <QuickSettingsButton
      tooltip={isAvailable ? "Pause Workers" : "Start Workers"}
      ariaLabel={isAvailable ? "Pause workers" : "Start workers"}
      icon={isAvailable ? <PauseCircle /> : <PlayCircle />}
      onClick={onClick}
      disabled={workerStatus.isEmpty()}
    />
  )
}

export default WorkerStatusSwitch
