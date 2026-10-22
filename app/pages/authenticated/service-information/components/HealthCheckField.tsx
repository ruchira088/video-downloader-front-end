import React, { type FC, type ReactNode } from "react"
import classNames from "classnames"
import { type HealthCheckStatusDetails, HealthStatus } from "~/models/HealthCheck"

import styles from "../ServiceInformation.module.scss"

type HealthCheckFieldProps = {
  readonly label: string
  readonly healthCheckStatusDetails: HealthCheckStatusDetails
  readonly icon?: ReactNode
}

const HealthCheckField: FC<HealthCheckFieldProps> = props => (
  <div className={styles.healthCheckField}>
    <div className={styles.healthCheckLabel}>
      {props.icon && <span className={styles.healthCheckIcon}>{props.icon}</span>}
      {props.label}
    </div>
    <div className={styles.healthCheckValue}>
      <div
        className={
        classNames(
          styles.healthCheckStatus,
          {
            [styles.unhealthy]: props.healthCheckStatusDetails.healthStatus === HealthStatus.Unhealthy,
            [styles.healthy]: props.healthCheckStatusDetails.healthStatus === HealthStatus.Healthy
          }
        )
      }>
        {props.healthCheckStatusDetails.healthStatus}
      </div>
      <div className={styles.healthCheckDuration}>
        ({props.healthCheckStatusDetails.duration.toMillis().toLocaleString()} ms)
      </div>
    </div>
  </div>
)

export default HealthCheckField
