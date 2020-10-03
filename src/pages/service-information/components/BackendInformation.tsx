import React from "react";
import BackendServiceInformation from "models/BackendServiceInformation";
import {Some} from "monet";
import {ServiceInformationItem} from "../ServiceInformation";

export default (apiServiceInformation: BackendServiceInformation) => (
    <div>
        <ServiceInformationItem label="Service Name" value={Some(apiServiceInformation.serviceName)}/>
        <ServiceInformationItem label="Service Version" value={Some(apiServiceInformation.serviceVersion)}/>
        <ServiceInformationItem label="Organization" value={Some(apiServiceInformation.organization)}/>
        <ServiceInformationItem label="Java Version" value={Some(apiServiceInformation.javaVersion)}/>
        <ServiceInformationItem label="Scala Version" value={Some(apiServiceInformation.scalaVersion)}/>
        <ServiceInformationItem label="sbt Version" value={Some(apiServiceInformation.sbtVersion)}/>
        <ServiceInformationItem label="Server Timestamp"
                                value={Some(apiServiceInformation.currentTimestamp.toString())}/>
        <ServiceInformationItem label="Git Branch" value={apiServiceInformation.gitBranch}/>
        <ServiceInformationItem label="Git Commit" value={apiServiceInformation.gitCommit}/>
        <ServiceInformationItem label="Build Timestamp"
                                value={apiServiceInformation.buildTimestamp.map(value => value.toString())}/>
    </div>
)
