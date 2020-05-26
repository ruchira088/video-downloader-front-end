import {Moment} from "moment";

export default interface FileResource {
    id: string
    createdAt: Moment
    path: string
    mediaType: string
    size: number
}
