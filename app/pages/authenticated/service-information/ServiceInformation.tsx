import React, { type FC, type ReactNode, useEffect, useState } from "react"
import {
  frontendServiceInformation,
  performHealthCheck,
  retrieveBackendServiceInformation
} from "~/services/health/HealthCheckService"
import { BackendServiceInformation } from "~/models/BackendServiceInformation"
import { LoadableComponent } from "~/components/hoc/loading/LoadableComponent"
import BackendInformation from "./components/BackendInformation"
import { apiConfiguration } from "~/services/ApiConfiguration"
import FrontendInformation from "./components/FrontendInformation"
import { Button, CircularProgress, IconButton, Tooltip } from "@mui/material"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import CheckIcon from "@mui/icons-material/Check"
import { None, type Option, Some } from "~/types/Option"
import Helmet from "~/components/helmet/Helmet"
import { DateTime } from "luxon"

import styles from "./ServiceInformation.module.scss"
import {
  type FileRepositoryHealthStatusDetails,
  HealthCheck,
  type HealthCheckStatusDetails,
  HealthStatus
} from "~/models/HealthCheck"
import classNames from "classnames"
import Timestamp from "~/components/timestamp/Timestamp"
import { Replay } from "@mui/icons-material"

interface ServiceInformationItem {
  readonly label: string
  readonly value: Option<ReactNode>
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

type CopyableTextProps = {
  readonly text: string
}

const CopyableText: FC<CopyableTextProps> = ({ text }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className={styles.copyableText}>
      <span>{text}</span>
      <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
        <IconButton
          size="small"
          onClick={handleCopy}
          className={styles.copyButton}
          aria-label="Copy to clipboard"
        >
          {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </span>
  )
}

type HealthCheckDetails = { readonly timestamp: DateTime } & HealthCheck

type FileRepositoryHealthCheckProps = {
  readonly fileRepositoryHealthStatusDetails: FileRepositoryHealthStatusDetails
}

const FileRepositoryHealthCheck: FC<FileRepositoryHealthCheckProps> = props => (
  <div className={styles.healthCheckSection}>
    <div className={styles.healthCheckSectionTitle}>File Repository</div>
    <div className={styles.healthCheckSectionContent}>
      <div className={styles.healthCheckSection}>
        <div className={styles.healthCheckSectionTitle}>Image Folder</div>
        <div className={styles.healthCheckSectionContent}>
          <HealthCheckField
            label={props.fileRepositoryHealthStatusDetails.imageFolder.filePath}
            healthCheckStatusDetails={props.fileRepositoryHealthStatusDetails.imageFolder.healthStatusDetails}/>
        </div>
      </div>
      <div className={styles.healthCheckSection}>
        <div className={styles.healthCheckSectionTitle}>Video Folder</div>
        <div className={styles.healthCheckSectionContent}>
          <HealthCheckField
            label={props.fileRepositoryHealthStatusDetails.videoFolder.filePath}
            healthCheckStatusDetails={props.fileRepositoryHealthStatusDetails.videoFolder.healthStatusDetails}/>
        </div>
      </div>
      {props.fileRepositoryHealthStatusDetails.otherVideoFolders && props.fileRepositoryHealthStatusDetails.otherVideoFolders.length > 0 && (
        <div className={styles.healthCheckSection}>
          <div className={styles.healthCheckSectionTitle}>Other Folders</div>
          <div className={styles.healthCheckSectionContent}>
            {props.fileRepositoryHealthStatusDetails.otherVideoFolders.map(healthCheckStatusDetails =>
              <HealthCheckField
                key={healthCheckStatusDetails.filePath}
                label={healthCheckStatusDetails.filePath}
                healthCheckStatusDetails={healthCheckStatusDetails.healthStatusDetails}/>
            )}
          </div>
        </div>
      )}
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
  readonly performHealthCheck: () => Promise<void>
}

const HealthCheckInformation: FC<HealthCheckInformationProps> = props => {
  const [currentTimestamp, setCurrentTimestamp] = useState<DateTime>(DateTime.now())
  const [isPerformingHealthCheck, setPerformingHealthCheck] = useState<boolean>(false)

  useEffect(() => {
    const intervalId = setInterval(() => setCurrentTimestamp(DateTime.now()), 1000)
    return () => clearInterval(intervalId)
  }, [])

  const handlePerformHealthCheck = async () => {
    setPerformingHealthCheck(true)
    await props.performHealthCheck()
    setPerformingHealthCheck(false)
  }

  return (
    <div className={styles.healthChecks}>
      <div className={styles.healthChecksTitle}>Health Checks</div>
      <div className={styles.lastHealthCheck}>
        <div className={styles.lastHealthCheckTimestamp}>
          <span className={styles.lastHealthCheckLabel}>Last Health Check:</span>
          <Timestamp
            timestamp={props.healthCheckDetails.timestamp}
            currentTimestamp={currentTimestamp}
            format={DateTime.DATETIME_MED_WITH_SECONDS} />
        </div>
        <Button onClick={handlePerformHealthCheck} disabled={isPerformingHealthCheck} loading={isPerformingHealthCheck}>
          <Replay fontSize="small" />
        </Button>
      </div>
      <div className={styles.healthCheckSection}>
        <div className={styles.healthCheckSectionTitle}>Services</div>
        <div className={styles.healthCheckSectionContent}>
          <HealthCheckField label="Database" healthCheckStatusDetails={props.healthCheckDetails.database}/>
          <HealthCheckField label="Key Value Store" healthCheckStatusDetails={props.healthCheckDetails.keyValueStore}/>
          <HealthCheckField label="PubSub" healthCheckStatusDetails={props.healthCheckDetails.pubSub}/>
          <HealthCheckField label="SPA Renderer" healthCheckStatusDetails={props.healthCheckDetails.spaRenderer}/>
          <HealthCheckField
            label="Internet Connectivity"
            healthCheckStatusDetails={props.healthCheckDetails.internetConnectivity}/>
        </div>
      </div>
      <FileRepositoryHealthCheck fileRepositoryHealthStatusDetails={props.healthCheckDetails.fileRepository}/>
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
          <div className={styles.sectionTitle}>Backend</div>
          <ServiceInformationItem label="API URL" value={Some.of(<CopyableText text={apiConfiguration.baseUrl} />)}/>
          <LoadableComponent>
            {backendInformation.map((backendServiceInfo) => <BackendInformation
              backendServiceInformation={backendServiceInfo}/>)}
          </LoadableComponent>
        </div>
        <div className={styles.frontend}>
          <div className={styles.sectionTitle}>Frontend</div>
          <FrontendInformation frontendServiceInformation={frontendInformation}/>
        </div>
      </div>
      <LoadableComponent loadingComponent={<div className={styles.loadingContainer}>Performing health checks...<CircularProgress size="2em"/></div>}>
        {
          healthCheckDetails.map((healthCheckDetails) =>
            <HealthCheckInformation
              healthCheckDetails={healthCheckDetails}
              performHealthCheck={fetchHealthCheckDetails} />)
        }
      </LoadableComponent>
    </div>
  )
}

export default ServiceInformation
