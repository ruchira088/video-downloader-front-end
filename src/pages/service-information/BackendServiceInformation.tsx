import React from "react";
import ApiServiceInformation from "models/ApiServiceInformation";
import {Maybe, Some} from "monet";

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

export default (apiServiceInformation: ApiServiceInformation) => (
    <div className="api-service-information">
        <ServiceInformationItem label="Service Name" value={Some(apiServiceInformation.serviceName)}/>
        <ServiceInformationItem label="Service Version" value={Some(apiServiceInformation.serviceVersion)}/>
        <ServiceInformationItem label="Organization" value={Some(apiServiceInformation.organization)}/>
        <ServiceInformationItem label="Java Version" value={Some(apiServiceInformation.javaVersion)}/>
        <ServiceInformationItem label="Scala Version" value={Some(apiServiceInformation.scalaVersion)}/>
        <ServiceInformationItem label="sbt Version" value={Some(apiServiceInformation.sbtVersion)}/>
        <ServiceInformationItem label="Server Timestamp"
                                value={Some(apiServiceInformation.currentTimestamp.toString())}/>
        <ServiceInformationItem label="git Branch" value={apiServiceInformation.gitBranch}/>
        <ServiceInformationItem label="git Commit" value={apiServiceInformation.gitCommit}/>
        <ServiceInformationItem label="Build Timestamp"
                                value={apiServiceInformation.buildTimestamp.map(value => value.toString())}/>
    </div>
)
