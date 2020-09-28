import React, {useEffect, useState} from "react"
import {Maybe, None, Some} from "monet"
import {apiServiceInformation} from "services/health/HealthCheckService"
import ApiServiceInformation from "models/ApiServiceInformation"
import loadableComponent from "components/hoc/loadableComponent"
import BackendServiceInformation, {ServiceInformationItem} from "./BackendServiceInformation"
import {CONFIGURATION} from "services/Configuration";

export default () => {
    const [serviceInformation, setServiceInformation] = useState<Maybe<ApiServiceInformation>>(None())

    const fetchServerInformation =
        () => apiServiceInformation().then(information => setServiceInformation(Some(information)))

    useEffect(() => {
        fetchServerInformation()

        const intervalId = setInterval(fetchServerInformation, 1000)

        return () => clearTimeout(intervalId)

    }, [])

    return (
        <div className="service-information">
            <ServiceInformationItem label="API URL" value={Some(CONFIGURATION.apiService)}/>
            {loadableComponent(BackendServiceInformation, serviceInformation)}
        </div>
    )
}
