import { Moment } from "moment";

export default interface FileResource {
  readonly id: string;
  readonly createdAt: Moment;
  readonly path: string;
  readonly mediaType: string;
  readonly size: number;
}
