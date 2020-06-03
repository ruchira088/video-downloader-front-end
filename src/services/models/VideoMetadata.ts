import FileResource from "./FileResource";
import {Duration} from "moment";
import {VideoSite} from "./VideoSite";

export default interface VideoMetadata {
    url: string
    id: string
    videoSite: VideoSite
    title: string
    duration: Duration
    size: number,
    thumbnail: FileResource
}
