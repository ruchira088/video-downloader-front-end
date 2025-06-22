import React, {type FC} from "react"
import {BackendServiceInformation} from "~/models/BackendServiceInformation"
import {ServiceInformationItem} from "../ServiceInformation"
import {Some} from "~/types/Option"
import {DateTime} from "luxon"
import Timestamp from "~/components/timestamp/Timestamp"

type BackendInformationProps = {
  readonly backendServiceInformation: BackendServiceInformation
}

const BackendInformation: FC<BackendInformationProps> = ({backendServiceInformation}) => (
  <div>
      <ServiceInformationItem label="Service Name" value={Some.of(backendServiceInformation.serviceName)} />
      <ServiceInformationItem label="Service Version" value={Some.of(backendServiceInformation.serviceVersion)} />
      <ServiceInformationItem label="Organization" value={Some.of(backendServiceInformation.organization)} />
      <ServiceInformationItem label="Java Version" value={Some.of(backendServiceInformation.javaVersion)} />
      <ServiceInformationItem label="Scala Version" value={Some.of(backendServiceInformation.scalaVersion)} />
      <ServiceInformationItem label="sbt Version" value={Some.of(backendServiceInformation.sbtVersion)} />
    <ServiceInformationItem
      label="Server Timestamp"
      value={Some.of(backendServiceInformation.currentTimestamp.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS))}/>
      <ServiceInformationItem label="Git Branch" value={backendServiceInformation.gitBranch} />
      <ServiceInformationItem label="Git Commit" value={backendServiceInformation.gitCommit} />
    <ServiceInformationItem
      label="Build Timestamp"
      value={
          backendServiceInformation.buildTimestamp
            .map(
              (timestamp) =>
                <Timestamp timestamp={timestamp} format={DateTime.DATETIME_MED_WITH_SECONDS}/>
            )
      }
    />
  </div>
)

export default BackendInformation
