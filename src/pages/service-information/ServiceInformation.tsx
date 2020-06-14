import React, {useEffect, useState} from "react"
import {Maybe, None, Some} from "monet"
import {apiServiceInformation} from "services/health/HealthCheckService"
import ApiServiceInformation from "services/models/ApiServiceInformation"
import loadableComponent from "components/hoc/loadableComponent"
import BackendServiceInformation, {ServiceInformationItem} from "./BackendServiceInformation"
import configuration from "services/Configuration";

export default () => {
    const [service, setServiceInformation] = useState<Maybe<ApiServiceInformation>>(None())

    const fetchServerInformation =
        () => apiServiceInformation().then(information => setServiceInformation(Some(information)))

    useEffect(() => {
        fetchServerInformation()

        const intervalId = setInterval(fetchServerInformation, 1000)

        return () => clearTimeout(intervalId)

    }, [])

    return (
        <div className="service-information">
            <ServiceInformationItem label="API URL" value={Some(configuration.apiService)}/>
            {loadableComponent(BackendServiceInformation, service)}
        </div>
    )
}
