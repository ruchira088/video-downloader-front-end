import React from "react"
import { configuration } from "services/Configuration"

export default () =>
    <div>
        Unable to connect to { configuration.apiService }
    </div>
