import React from "react"
import { configuration } from "~/services/ApiConfiguration"

const ServerErrorPage = () => <div>Unable to connect to {configuration.baseUrl}</div>

export default ServerErrorPage
