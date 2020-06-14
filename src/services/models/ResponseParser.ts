import VideoMetadata from "./VideoMetadata";
import moment from "moment";
import FileResource from "./FileResource";
import Video from "./Video";
import SearchResult from "./ListResult";
import ScheduledVideoDownload from "./ScheduledVideoDownload";
import {Maybe} from "monet";
import {VideoAnalysisResult} from "./VideoAnalysisResult";
import {Snapshot} from "./Snapshot";

const parseVideoMetadata =
    (json: any): VideoMetadata => ({
        ...json,
        duration: moment.duration(json.duration.length, json.duration.unit),
        thumbnail: parseFileResource(json.thumbnail),
    })

const parseFileResource =
    (json: any): FileResource => ({...json, createdAt: moment(json.createdAt)})

export const parseVideo = (json: any): Video => ({
    videoMetadata: parseVideoMetadata(json.videoMetadata),
    fileResource: parseFileResource(json.fileResource)
})

export const parseSnapshot = (json: any): Snapshot => ({
    videoId: json.videoId,
    fileResource: parseFileResource(json.fileResource),
    videoTimestamp: moment.duration(json.videoTimestamp.length, json.videoTimestamp.unit)
})

export function searchResultParser<A>(parser: (json: any) => A): (json: any) => SearchResult<A> {
    return (json: any) => ({...json, results: json.results.map(parser) })
}

export const parseVideoAnalysisResult =
    (json: any): VideoAnalysisResult => ({
        ...json,
        duration: moment.duration(json.duration.length, json.duration.unit)
    })

export const parseScheduledVideoDownload =
    (json: any): ScheduledVideoDownload => ({
        scheduledAt: moment(json.scheduledAt),
        lastUpdatedAt: moment(json.lastUpdatedAt),
        videoMetadata: parseVideoMetadata(json.videoMetadata),
        downloadedBytes: json.downloadedBytes,
        completedAt: Maybe.fromNull(json.completedAt).map(moment)
    })
