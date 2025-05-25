import React, { useEffect, useState } from "react"
import { WorkerStatus } from "~/models/WorkerStatus"
import { fetchWorkerStatus, updateWorkerStatus } from "~/services/scheduling/SchedulingService"
import { FormControlLabel, Switch, LinearProgress, CircularProgress } from "@mui/material"

const WorkerStatusSwitch = () => {
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null)

  useEffect(() => {
    fetchWorkerStatus().then((status) => setWorkerStatus(status))
  }, [])

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const updated: WorkerStatus = event.target.checked ? WorkerStatus.Available : WorkerStatus.Paused
    const existingValue = workerStatus
    setWorkerStatus(updated)

    try {
      await updateWorkerStatus(updated)
    } catch (e) {
      console.log(e)
      setWorkerStatus(existingValue)
    }
  }

  return (
    <FormControlLabel
      control={
        <Switch
          checked={workerStatus === WorkerStatus.Available}
          onChange={onChange}
          disabled={workerStatus === null}/>
    }
      label="Worker Status"
    />
  )
}

export default WorkerStatusSwitch