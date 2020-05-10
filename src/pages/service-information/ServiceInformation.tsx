import React, {useEffect, useState} from "react"
import {Maybe, None, Some} from "monet"
import {apiServiceInformation} from "services/health/HealthCheckService"
import ApiServiceInformation from "services/models/ApiServiceInformation"
import loadableComponent from "components/hoc/loadableComponent"
import BackendServiceInformation, {ServiceInformationItem} from "./BackendServiceInformation"
import configuration from "services/Configuration";

export default () => {
    const [service, setServiceInformation] = useState<Maybe<ApiServiceInformation>>(None())

    useEffect(() => {
        apiServiceInformation().then(information => setServiceInformation(Some(information)))
    }, [])

    return (
        <div className="service-information">
            <ServiceInformationItem label="API URL" value={configuration.apiService}/>
            { loadableComponent(BackendServiceInformation, service) }
        </div>
    )
}
