import React from "react"
import BackendServiceInformation from "models/BackendServiceInformation"
import { Some } from "monet"
import { ServiceInformationItem } from "../ServiceInformation"
import moment from "moment"

const BackendInformation = (apiServiceInformation: BackendServiceInformation) => (
  <div>
    <ServiceInformationItem label="Service Name" value={Some(apiServiceInformation.serviceName)} />
    <ServiceInformationItem label="Service Version" value={Some(apiServiceInformation.serviceVersion)} />
    <ServiceInformationItem label="Organization" value={Some(apiServiceInformation.organization)} />
    <ServiceInformationItem label="Java Version" value={Some(apiServiceInformation.javaVersion)} />
    <ServiceInformationItem label="Scala Version" value={Some(apiServiceInformation.scalaVersion)} />
    <ServiceInformationItem label="sbt Version" value={Some(apiServiceInformation.sbtVersion)} />
    <ServiceInformationItem label="Server Timestamp" value={Some(apiServiceInformation.currentTimestamp.toString())} />
    <ServiceInformationItem label="Git Branch" value={apiServiceInformation.gitBranch} />
    <ServiceInformationItem label="Git Commit" value={apiServiceInformation.gitCommit} />
    <ServiceInformationItem
      label="Build Timestamp"
      value={apiServiceInformation.buildTimestamp.map(
        (timestamp) => `${timestamp} (${moment.duration(timestamp.unix() - moment().unix(), "seconds").humanize(true)})`
      )}
    />
  </div>
)

export default BackendInformation
