import React, { useEffect, useState } from "react"
import { Maybe, None, Some } from "monet"
import { backendServiceInformation, frontendServiceInformation } from "services/health/HealthCheckService"
import BackendServiceInformation from "models/BackendServiceInformation"
import loadableComponent from "components/hoc/loading/loadableComponent"
import BackendInformation from "./components/BackendInformation"
import { configuration } from "services/Configuration"
import FrontendInformation from "./components/FrontendInformation"
import moment from "moment"

interface ServiceInformationItem {
  readonly label: string
  readonly value: Maybe<string>
}

export const ServiceInformationItem = (serviceInformationItem: ServiceInformationItem) =>
  serviceInformationItem.value.fold(<div />)((value) => (
    <div className="service-information-item">
      <div className="label">{serviceInformationItem.label}</div>
      <div className="value">{value}</div>
    </div>
  ))

const ServiceInformation = () => {
  const [backendInformation, setBackendInformation] = useState<Maybe<BackendServiceInformation>>(None())
  const [frontendInformation, setFrontendInformation] = useState(frontendServiceInformation(process.env))

  const fetchBackendInformation = () =>
    backendServiceInformation().then((information) => setBackendInformation(Some(information)))

  useEffect(() => {
    fetchBackendInformation()

    const intervalId = setInterval(fetchBackendInformation, 500)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() =>
      setFrontendInformation((frontendInformation) => ({
        ...frontendInformation,
        timestamp: moment(),
      }))
    )

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="service-information">
      <div className="back-end">
        <ServiceInformationItem label="API URL" value={Some(configuration.apiService)} />
        {loadableComponent(BackendInformation, backendInformation)}
      </div>
      <div className="front-end">
        <FrontendInformation frontendServiceInformation={frontendInformation} />
      </div>
    </div>
  )
}

export default ServiceInformation
