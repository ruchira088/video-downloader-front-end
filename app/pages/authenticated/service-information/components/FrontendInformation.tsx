import React from "react"
import {ServiceInformationItem} from "../ServiceInformation"
import type {FrontendServiceInformation} from "~/models/FrontendServiceInformation"
import {Some} from "~/types/Option"
import {DateTime} from "luxon"
import Timestamp from "~/components/timestamp/Timestamp"

const FrontendInformation = ({ frontendServiceInformation }: { frontendServiceInformation: FrontendServiceInformation }) => (
  <div>
    <ServiceInformationItem label="Name" value={Some.of(frontendServiceInformation.name)} />
    <ServiceInformationItem label="Version" value={Some.of(frontendServiceInformation.version)} />
    <ServiceInformationItem label="Git Branch" value={frontendServiceInformation.gitBranch} />
    <ServiceInformationItem label="Git Commit" value={frontendServiceInformation.gitCommit} />
    <ServiceInformationItem
      label="Timestamp"
      value={Some.of(frontendServiceInformation.timestamp.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS))}/>
    <ServiceInformationItem
      label="Build Timestamp"
      value={
        frontendServiceInformation.buildTimestamp
          .map(
            (timestamp) =>
              <Timestamp timestamp={timestamp} format={DateTime.DATETIME_MED_WITH_SECONDS}/>
          )
      }
    />
  </div>
)

export default FrontendInformation