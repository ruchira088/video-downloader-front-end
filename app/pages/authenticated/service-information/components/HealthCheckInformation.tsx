import React, { type FC, useEffect, useState } from "react"
import { Button } from "@mui/material"
import StorageIcon from "@mui/icons-material/Storage"
import VpnKeyIcon from "@mui/icons-material/VpnKey"
import CloudQueueIcon from "@mui/icons-material/CloudQueue"
import WebIcon from "@mui/icons-material/Web"
import PublicIcon from "@mui/icons-material/Public"
import ImageIcon from "@mui/icons-material/Image"
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary"
import FolderIcon from "@mui/icons-material/Folder"
import Replay from "@mui/icons-material/Replay"
import { DateTime } from "luxon"
import type { FileRepositoryHealthStatusDetails } from "~/models/HealthCheck"
import Timestamp from "~/components/timestamp/Timestamp"
import type { HealthCheckDetails } from "../useHealthCheck"
import HealthCheckField from "./HealthCheckField"

import styles from "../ServiceInformation.module.scss"

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
            icon={<ImageIcon fontSize="small" />}
            healthCheckStatusDetails={props.fileRepositoryHealthStatusDetails.imageFolder.healthStatusDetails}/>
        </div>
      </div>
      <div className={styles.healthCheckSection}>
        <div className={styles.healthCheckSectionTitle}>Video Folder</div>
        <div className={styles.healthCheckSectionContent}>
          <HealthCheckField
            label={props.fileRepositoryHealthStatusDetails.videoFolder.filePath}
            icon={<VideoLibraryIcon fontSize="small" />}
            healthCheckStatusDetails={props.fileRepositoryHealthStatusDetails.videoFolder.healthStatusDetails}/>
        </div>
      </div>
      {props.fileRepositoryHealthStatusDetails.otherVideoFolders.length > 0 && (
        <div className={styles.healthCheckSection}>
          <div className={styles.healthCheckSectionTitle}>Other Folders</div>
          <div className={styles.healthCheckSectionContent}>
            {props.fileRepositoryHealthStatusDetails.otherVideoFolders.map(healthCheckStatusDetails =>
              <HealthCheckField
                key={healthCheckStatusDetails.filePath}
                label={healthCheckStatusDetails.filePath}
                icon={<FolderIcon fontSize="small" />}
                healthCheckStatusDetails={healthCheckStatusDetails.healthStatusDetails}/>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
)

type HealthCheckInformationProps = {
  readonly healthCheckDetails: HealthCheckDetails
  readonly isRefreshing: boolean
  readonly onRefresh: () => Promise<void>
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
      <div className={styles.lastHealthCheck}>
        <div className={styles.lastHealthCheckTimestamp}>
          <span className={styles.lastHealthCheckLabel}>Last Health Check:</span>
          <Timestamp
            timestamp={props.healthCheckDetails.timestamp}
            currentTimestamp={currentTimestamp}
            format={DateTime.DATETIME_MED_WITH_SECONDS} />
        </div>
        <Button onClick={() => void props.onRefresh()} disabled={props.isRefreshing} loading={props.isRefreshing} aria-label="Refresh health check">
          <Replay fontSize="small" />
        </Button>
      </div>
      <div className={styles.healthCheckSection}>
        <div className={styles.healthCheckSectionTitle}>Services</div>
        <div className={styles.healthCheckSectionContent}>
          <HealthCheckField label="Database" icon={<StorageIcon fontSize="small" />} healthCheckStatusDetails={props.healthCheckDetails.database}/>
          <HealthCheckField label="Key Value Store" icon={<VpnKeyIcon fontSize="small" />} healthCheckStatusDetails={props.healthCheckDetails.keyValueStore}/>
          <HealthCheckField label="PubSub" icon={<CloudQueueIcon fontSize="small" />} healthCheckStatusDetails={props.healthCheckDetails.pubSub}/>
          <HealthCheckField label="SPA Renderer" icon={<WebIcon fontSize="small" />} healthCheckStatusDetails={props.healthCheckDetails.spaRenderer}/>
          <HealthCheckField
            label="Internet Connectivity"
            icon={<PublicIcon fontSize="small" />}
            healthCheckStatusDetails={props.healthCheckDetails.internetConnectivity}/>
        </div>
      </div>
      <FileRepositoryHealthCheck fileRepositoryHealthStatusDetails={props.healthCheckDetails.fileRepository}/>
    </div>
  )
}

export default HealthCheckInformation
