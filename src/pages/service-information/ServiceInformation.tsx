import React, {useEffect, useState} from "react"
import {Maybe, None, Some} from "monet"
import {backendServiceInformation, frontendServiceInformation} from "services/health/HealthCheckService"
import BackendServiceInformation from "models/BackendServiceInformation"
import loadableComponent from "components/hoc/loading/loadableComponent"
import BackendInformation from "./components/BackendInformation"
import {configuration} from "services/Configuration";
import FrontendInformation from "./components/FrontendInformation";
import moment from "moment";

interface ServiceInformationItem {
    readonly label: string
    readonly value: Maybe<string>
}

export const ServiceInformationItem =
    (serviceInformationItem: ServiceInformationItem) =>
        serviceInformationItem.value.fold(<div/>)(
            value =>
                <div className="service-information-item">
                    <div className="label">{serviceInformationItem.label}</div>
                    <div className="value">{value}</div>
                </div>
        )

export default () => {
    const [serviceInformation, setServiceInformation] = useState<Maybe<BackendServiceInformation>>(None())
    const [frontendInformation, setFrontendInformation] = useState(frontendServiceInformation)

    const fetchServerInformation =
        () => backendServiceInformation().then(information => setServiceInformation(Some(information)))

    useEffect(() => {
        fetchServerInformation()

        const intervalId = setInterval(fetchServerInformation, 1000)

        return () => clearInterval(intervalId)
    }, [])

    useEffect(() => {
        const intervalId = setInterval(() => setFrontendInformation(frontendInformation => ({
            ...frontendInformation,
            timestamp: moment()
        })))

        return () => clearInterval(intervalId)
    }, [])

    return (
        <div className="service-information">
            <div>
                <ServiceInformationItem label="API URL" value={Some(configuration.apiService)}/>
                {loadableComponent(BackendInformation, serviceInformation)}
            </div>
            <div>
                <FrontendInformation frontendServiceInformation={frontendInformation}/>
            </div>
        </div>
    )
}
