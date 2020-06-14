import React from "react"
import {imageUrl} from "services/asset/AssetService"
import {Snapshot} from "services/models/Snapshot";
import ApplicationContext from "context/ApplicationContext";
import {shortHumanReadableDuration} from "utils/Formatter"

const VideoSnapshot =
    (snapshot: Snapshot) => (
        <ApplicationContext.Consumer>
            { ({safeMode}) =>
                <div>
                    { shortHumanReadableDuration(snapshot.videoTimestamp) }
                    <img src={imageUrl(snapshot.fileResource.id, safeMode)} alt="video snapshot"/>
                </div>
            }
        </ApplicationContext.Consumer>
    )


export default ({snapshots}: ({snapshots: Snapshot[]})) => (
    <div>
        {
            snapshots
                .sort((snapshotA, snapshotB) => snapshotA.videoTimestamp.asMilliseconds() - snapshotB.videoTimestamp.asMilliseconds())
                .map((snapshot, index) => <VideoSnapshot key={index} {...snapshot}/>)
        }
    </div>
)


