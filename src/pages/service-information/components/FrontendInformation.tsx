import React from "react"
import { ServiceInformationItem } from "../ServiceInformation"
import { Some } from "monet"
import { FrontendServiceInformation } from "models/FrontendServiceInformation"
import moment from "moment"

const FrontendInformation = ({ frontendServiceInformation }: { frontendServiceInformation: FrontendServiceInformation }) => (
  <div>
    <ServiceInformationItem label="Name" value={Some(frontendServiceInformation.name)} />
    <ServiceInformationItem label="Version" value={Some(frontendServiceInformation.version)} />
    <ServiceInformationItem label="Git Branch" value={frontendServiceInformation.gitBranch} />
    <ServiceInformationItem label="Git Commit" value={frontendServiceInformation.gitCommit} />
    <ServiceInformationItem label="Timestamp" value={Some(frontendServiceInformation.timestamp.toString())} />
    <ServiceInformationItem
      label="Build Timestamp"
      value={frontendServiceInformation.buildTimestamp.map(
        (timestamp) => `${timestamp} (${moment.duration(timestamp.unix() - moment().unix(), "seconds").humanize(true)})`
      )}
    />
  </div>
)

export default FrontendInformation