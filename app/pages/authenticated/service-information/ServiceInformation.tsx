import React, { useEffect, useState } from "react"
import { backendServiceInformation, frontendServiceInformation } from "~/services/health/HealthCheckService"
import { BackendServiceInformation } from "~/models/BackendServiceInformation"
import loadableComponent from "~/components/hoc/loading/loadableComponent"
import BackendInformation from "./components/BackendInformation"
import { configuration } from "~/services/Configuration"
import FrontendInformation from "./components/FrontendInformation"
import { Button } from "@mui/material"
import { scanForVideos } from "~/services/video/VideoService"
import { None, type Option, Some } from "~/types/Option"
import { DateTime } from "luxon"

interface ServiceInformationItem {
  readonly label: string
  readonly value: Option<string>
}

export const ServiceInformationItem = (serviceInformationItem: ServiceInformationItem) =>
  serviceInformationItem.value
    .fold(
      () => <div />,
      (value) => (
        <div className="service-information-item">
          <div className="label">{serviceInformationItem.label}</div>
          <div className="value">{value}</div>
        </div>
      )
    )

const ServiceInformation = () => {
  const [backendInformation, setBackendInformation] = useState<Option<BackendServiceInformation>>(None.of())
  const [frontendInformation, setFrontendInformation] = useState(frontendServiceInformation(import.meta.env))

  const fetchBackendInformation = async () => {
    const information = await backendServiceInformation()
    setBackendInformation(Some.of(information))
  }

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
    <div className="service-information">
      {/*<Helmet>*/}
      {/*  <title>Service Information</title>*/}
      {/*</Helmet>*/}
      <div className="back-end">
        <ServiceInformationItem label="API URL" value={Some.of(configuration.apiService)} />
        {loadableComponent(BackendInformation, backendInformation)}
      </div>
      <div className="front-end">
        <FrontendInformation frontendServiceInformation={frontendInformation} />
      </div>
      <Button variant="contained" onClick={() => scanForVideos()}>Scan For Videos</Button>
    </div>
  )
}

export default ServiceInformation
