import React, { useEffect, useState } from "react"
import { WorkerStatus } from "~/models/WorkerStatus"
import { fetchWorkerStatus, updateWorkerStatus } from "~/services/scheduling/SchedulingService"
import { FormControlLabel, Switch } from "@mui/material"

export default () => {
  const [workerStatus, setWorkerStatus] = useState(WorkerStatus.Available)

  useEffect(() => {
    fetchWorkerStatus().then((status) => setWorkerStatus(status))
  })

  return (
    <FormControlLabel
      control={
        <Switch
          checked={workerStatus === WorkerStatus.Available}
          onChange={({ target }) => {
            const updated: WorkerStatus = target.checked ? WorkerStatus.Available : WorkerStatus.Paused

            updateWorkerStatus(updated).then((value) => setWorkerStatus(value))
          }}
        />
      }
      label="Worker Status"
    />
  )
}
