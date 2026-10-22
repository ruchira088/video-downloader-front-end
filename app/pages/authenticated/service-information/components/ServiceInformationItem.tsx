import React, { type ReactNode } from "react"
import type { Option } from "~/types/Option"

import styles from "../ServiceInformation.module.scss"

type ServiceInformationItemProps = {
  readonly label: string
  readonly value: Option<ReactNode>
}

/** A labelled value, or nothing at all when the value is absent. */
const ServiceInformationItem = (serviceInformationItem: ServiceInformationItemProps) =>
  serviceInformationItem.value
    .fold(
      () => null,
      (value) => (
        <div className={styles.serviceInformationItem}>
          <div className={styles.serviceInformationItemLabel}>{serviceInformationItem.label}:</div>
          <div className={styles.serviceInformationItemValue}>{value}</div>
        </div>
      )
    )

export default ServiceInformationItem
