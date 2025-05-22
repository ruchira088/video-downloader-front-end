import React from "react"
import { configuration } from "~/services/Configuration"

const ServerErrorPage = () => <div>Unable to connect to {configuration.apiService}</div>

export default ServerErrorPage
