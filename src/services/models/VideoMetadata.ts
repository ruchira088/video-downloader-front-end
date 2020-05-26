import FileResource from "./FileResource";
import {Duration} from "moment";

export default interface VideoMetadata {
    url: string
    id: string
    videoSite: VideoSite
    title: string
    duration: Duration
    size: number,
    thumbnail: FileResource
}

enum VideoSite {
    VPorn = "VPorn",
    SpankBang = "SpankBang"
}
