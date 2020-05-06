import FileResource from "./FileResource";

export default interface VideoMetadata {
    url: string
    key: string
    videoSite: VideoSite
    title: string
    duration: string
    size: number,
    thumbnail: FileResource
}

enum VideoSite {
    VPorn = "VPorn"
}
