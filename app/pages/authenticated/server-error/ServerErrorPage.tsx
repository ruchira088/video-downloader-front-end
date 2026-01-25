import React from "react"
import { apiConfiguration } from "~/services/ApiConfiguration"

const ServerErrorPage = () => <div>Unable to connect to {apiConfiguration.baseUrl}</div>

export default ServerErrorPage
