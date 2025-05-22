import React from "react"
import { BackendServiceInformation } from "~/models/BackendServiceInformation"
import { ServiceInformationItem } from "../ServiceInformation"
import { Option, Some } from "~/types/Option"
import { DateTime, Duration } from "luxon"

const BackendInformation = (backendServiceInformation: BackendServiceInformation) => (
  <div>
      <ServiceInformationItem label="Service Name" value={Some.of(backendServiceInformation.serviceName)} />
      <ServiceInformationItem label="Service Version" value={Some.of(backendServiceInformation.serviceVersion)} />
      <ServiceInformationItem label="Organization" value={Some.of(backendServiceInformation.organization)} />
      <ServiceInformationItem label="Java Version" value={Some.of(backendServiceInformation.javaVersion)} />
      <ServiceInformationItem label="Scala Version" value={Some.of(backendServiceInformation.scalaVersion)} />
      <ServiceInformationItem label="sbt Version" value={Some.of(backendServiceInformation.sbtVersion)} />
      <ServiceInformationItem label="Server Timestamp"
                              value={Some.of(backendServiceInformation.currentTimestamp.toString())} />
      <ServiceInformationItem label="Git Branch" value={backendServiceInformation.gitBranch} />
      <ServiceInformationItem label="Git Commit" value={backendServiceInformation.gitCommit} />
    <ServiceInformationItem
      label="Build Timestamp"
      value={
          backendServiceInformation.buildTimestamp
            .map(
              (timestamp) =>
                `${timestamp} (${timestamp.toRelative({ base: DateTime.now()})})`
            )
      }
    />
  </div>
)

export default BackendInformation
