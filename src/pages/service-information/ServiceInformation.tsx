import React, { useEffect, useState } from "react"
import {Maybe, None, Some} from "monet"
import {ApiServiceInformation, apiServiceInformation} from "../../services/HealthCheckService"
import loadableComponent from "../../components/hoc/loadableComponent";

const BackendServiceInformation =
    (props: ApiServiceInformation) => (
        <div className="api-service-information">
            { props.serviceName }
        </div>
    )

export default () => {
    const [service, setServiceInformation] = useState<Maybe<ApiServiceInformation>>(None())

    useEffect(() => {
        apiServiceInformation().then(information => setServiceInformation(Some(information)))
    }, [])

    return loadableComponent(BackendServiceInformation, service)
}
