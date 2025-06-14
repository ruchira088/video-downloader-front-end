import React, {type FC, useEffect, useState} from "react"
import {
  frontendServiceInformation,
  performHealthCheck,
  retrieveBackendServiceInformation
} from "~/services/health/HealthCheckService"
import {BackendServiceInformation} from "~/models/BackendServiceInformation"
import {LoadableComponent} from "~/components/hoc/loading/LoadableComponent"
import BackendInformation from "./components/BackendInformation"
import {configuration} from "~/services/Configuration"
import FrontendInformation from "./components/FrontendInformation"
import {Button, CircularProgress} from "@mui/material"
import {scanForVideos} from "~/services/video/VideoService"
import {None, type Option, Some} from "~/types/Option"
import Helmet from "~/components/helmet/Helmet"
import {DateTime} from "luxon"

import styles from "./ServiceInformation.module.scss"
import {
  type FileRepositoryHealthStatusDetails,
  HealthCheck,
  type HealthCheckStatusDetails,
  HealthStatus
} from "~/models/HealthCheck"
import classNames from "classnames"

interface ServiceInformationItem {
  readonly label: string
  readonly value: Option<string>
}

export const ServiceInformationItem = (serviceInformationItem: ServiceInformationItem) =>
  serviceInformationItem.value
    .fold(
      () => <div />,
      (value) => (
        <div className={styles.serviceInformationItem}>
          <div className={styles.serviceInformationItemLabel}>{serviceInformationItem.label}:</div>
          <div className={styles.serviceInformationItemValue}>{value}</div>
        </div>
      )
    )

type HealthCheckDetails = { readonly timestamp: DateTime } & HealthCheck

type FileRepositoryHealthCheckProps = {
  readonly fileRepositoryHealthStatusDetails: FileRepositoryHealthStatusDetails
}

const FileRepositoryHealthCheck: FC<FileRepositoryHealthCheckProps> = props => (
  <div>
    <div>File Repository</div>
    <div>
      <div>
        <div>Image Folder</div>
        <HealthCheckField
          label={props.fileRepositoryHealthStatusDetails.imageFolder.filePath}
          healthCheckStatusDetails={props.fileRepositoryHealthStatusDetails.imageFolder.healthStatusDetails}/>
      </div>
      <div>
        <div>Video Folder</div>
        <HealthCheckField
          label={props.fileRepositoryHealthStatusDetails.videoFolder.filePath}
          healthCheckStatusDetails={props.fileRepositoryHealthStatusDetails.videoFolder.healthStatusDetails}/>
      </div>
      <div>
        <div>Other Folders</div>
        {
          props.fileRepositoryHealthStatusDetails.otherVideoFolders?.map(healthCheckStatusDetails =>
            <HealthCheckField
              key={healthCheckStatusDetails.filePath}
              label={healthCheckStatusDetails.filePath}
              healthCheckStatusDetails={healthCheckStatusDetails.healthStatusDetails}/>
          )
        }
      </div>
    </div>
  </div>
)

type HealthCheckFieldProps = {
  readonly label: string
  readonly healthCheckStatusDetails: HealthCheckStatusDetails
}

const HealthCheckField: FC<HealthCheckFieldProps> = props => (
  <div className={styles.healthCheckField}>
    <div className={styles.healthCheckLabel}>{props.label}</div>
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

type HealthCheckInformationProps = {
  readonly healthCheckDetails: HealthCheckDetails
}

const HealthCheckInformation: FC<HealthCheckInformationProps> = props => {
  const [currentTimestamp, setCurrentTimestamp] = useState<DateTime>(DateTime.now())

  useEffect(() => {
    const intervalId = setInterval(() => setCurrentTimestamp(DateTime.now()), 1000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className={styles.healthChecks}>
      <div className={styles.healthChecksTitle}>Health Checks</div>
      <div>
        <div>Last Health Check</div>
        <div>{props.healthCheckDetails.timestamp.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)}</div>
        <div>({props.healthCheckDetails.timestamp.toRelative({base: currentTimestamp})})</div>
      </div>
      <div>
        <HealthCheckField label="Database" healthCheckStatusDetails={props.healthCheckDetails.database}/>
        <HealthCheckField label="KeyValueStore" healthCheckStatusDetails={props.healthCheckDetails.keyValueStore}/>
        <HealthCheckField label="PubSub" healthCheckStatusDetails={props.healthCheckDetails.pubSub}/>
        <HealthCheckField label="SPA Renderer" healthCheckStatusDetails={props.healthCheckDetails.spaRenderer}/>
        <HealthCheckField
          label="Internet Connectivity"
          healthCheckStatusDetails={props.healthCheckDetails.internetConnectivity}/>
        <FileRepositoryHealthCheck fileRepositoryHealthStatusDetails={props.healthCheckDetails.fileRepository}/>
      </div>
    </div>
  )
}

const ServiceInformation = () => {
  const [backendInformation, setBackendInformation] = useState<Option<BackendServiceInformation>>(None.of())
  const [frontendInformation, setFrontendInformation] = useState(frontendServiceInformation(import.meta.env))
  const [healthCheckDetails, setHealthCheckDetails] = useState<Option<HealthCheckDetails>>(None.of())

  const fetchBackendInformation = async () => {
    const information = await retrieveBackendServiceInformation()
    setBackendInformation(Some.of(information))
  }

  const fetchHealthCheckDetails = async () => {
    const healthCheck = await performHealthCheck()
    setHealthCheckDetails(Some.of({
      ...healthCheck,
      timestamp: DateTime.now()
    }))
  }

  useEffect(() => {
    fetchHealthCheckDetails()
    const intervalId = setInterval(fetchHealthCheckDetails, 30_000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    fetchBackendInformation()
    const intervalId = setInterval(fetchBackendInformation, 500)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const intervalId =
      setInterval(
        () =>
          setFrontendInformation((frontendInformation) => ({
            ...frontendInformation,
            timestamp: DateTime.now()
          })),
        1000
      )

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className={styles.serviceInformation}>
      <Helmet title="Service Information"/>
      <div className={styles.serviceDetails}>
        <div className={styles.backend}>
          <ServiceInformationItem label="API URL" value={Some.of(configuration.apiService)}/>
          <LoadableComponent>
            {backendInformation.map((backendServiceInfo) => <BackendInformation
              backendServiceInformation={backendServiceInfo}/>)}
          </LoadableComponent>
        </div>
        <div className={styles.frontend}>
          <FrontendInformation frontendServiceInformation={frontendInformation}/>
        </div>
      </div>
      <LoadableComponent loadingComponent={<div>Performing health checks...<CircularProgress size="2.5em"/></div>}>
        {
          healthCheckDetails.map((healthCheckDetails) =>
            <HealthCheckInformation healthCheckDetails={healthCheckDetails}/>)
        }
      </LoadableComponent>
    </div>
  )
}

export default ServiceInformation
