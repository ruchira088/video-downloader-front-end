import axios from "axios"
import {Moment} from "moment";

export interface ApiServiceInformation {
    serviceName: string
    serviceVersion: string
    organization: string
    scalaVersion: string
    sbtVersion: string
    javaVersion: string
    timestamp: Moment
}

export const apiServiceInformation:  () => Promise<ApiServiceInformation> =
    () => axios.get("http://localhost:8000/service").then(response => response.data)