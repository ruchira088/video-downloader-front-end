import React, { useEffect, useRef, useState } from "react"
import {
  frontendServiceInformation,
  retrieveBackendServiceInformation
} from "~/services/health/HealthCheckService"
import { BackendServiceInformation } from "~/models/BackendServiceInformation"
import { LoadableComponent } from "~/components/hoc/loading/LoadableComponent"
import BackendInformation from "./components/BackendInformation"
import { apiConfiguration } from "~/services/ApiConfiguration"
import FrontendInformation from "./components/FrontendInformation"
import CopyableText from "./components/CopyableText"
import HealthCheckInformation from "./components/HealthCheckInformation"
import ServiceInformationItem from "./components/ServiceInformationItem"
import { useHealthCheck } from "./useHealthCheck"
import { CircularProgress } from "@mui/material"
import { None, type Option, Some } from "~/types/Option"
import Helmet from "~/components/helmet/Helmet"
import { DateTime, Duration } from "luxon"

import styles from "./ServiceInformation.module.scss"

const ServiceInformation = () => {
  const [backendInformation, setBackendInformation] = useState<Option<BackendServiceInformation>>(None.of())
  const [frontendInformation, setFrontendInformation] = useState(frontendServiceInformation(import.meta.env))
  const { healthCheckDetails, isRefreshing, refresh } = useHealthCheck()
  const serverTimeOffset = useRef<Duration>(Duration.fromMillis(0))

  const fetchBackendInformation = async () => {
    try {
      const information = await retrieveBackendServiceInformation()
      serverTimeOffset.current = information.currentTimestamp.diff(DateTime.now())
      setBackendInformation(Some.of(information))
    } catch (error) {
      console.error("Failed to retrieve backend service information", error)
    }
  }

  useEffect(() => {
    // The setState happens after an await, so this is an async load rather than a cascading render.
    // oxlint-disable-next-line react/set-state-in-effect
    void fetchBackendInformation()
  }, [])

  useEffect(() => {
    const intervalId =
      setInterval(
        () =>
          setBackendInformation((backendInformation) =>
            backendInformation.map((information) => ({
              ...information,
              currentTimestamp: DateTime.now().plus(serverTimeOffset.current)
            }))
          ),
        1000
      )

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
              isRefreshing={isRefreshing}
              onRefresh={refresh} />)
        }
      </LoadableComponent>
    </div>
  )
}

export default ServiceInformation
