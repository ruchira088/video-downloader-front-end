import FileResource from "./FileResource";

export default interface VideoMetadata {
    url: string
    id: string
    videoSite: VideoSite
    title: string
    duration: number
    size: number,
    thumbnail: FileResource
}

enum VideoSite {
    VPorn = "VPorn"
}
