import React from "react";
import ApiServiceInformation from "services/models/ApiServiceInformation";
import moment from "moment";

interface ServiceInformationItem {
    label: string
    value: string
}

export const ServiceInformationItem =
    (serviceInformationItem: ServiceInformationItem) =>
        <div className="service-information-item">
            <div className="label">{ serviceInformationItem.label }</div>
            <div className="value">{ serviceInformationItem.value }</div>
        </div>

export default (apiServiceInformation: ApiServiceInformation) => (
    <div className="api-service-information">
        <ServiceInformationItem label="Service Name" value={apiServiceInformation.serviceName}/>
        <ServiceInformationItem label="Service Version" value={apiServiceInformation.serviceVersion}/>
        <ServiceInformationItem label="Organization" value={apiServiceInformation.organization}/>
        <ServiceInformationItem label="Java Version" value={apiServiceInformation.javaVersion}/>
        <ServiceInformationItem label="Scala Version" value={apiServiceInformation.scalaVersion}/>
        <ServiceInformationItem label="sbt Version" value={apiServiceInformation.sbtVersion}/>
        <ServiceInformationItem label="Server Timestamp" value={moment(apiServiceInformation.timestamp).toISOString()}/>
    </div>
)
