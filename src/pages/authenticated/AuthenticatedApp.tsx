import React, { useState } from "react"
import { BrowserRouter as Router } from "react-router-dom"
import { Grid } from "@mui/material"
import "./AuthenticatedApp.css"
import ApplicationContext, {
  ApplicationContext as Context,
  DEFAULT_APPLICATION_CONTEXT,
} from "context/ApplicationContext"
import ContentBody from "components/content-body/ContentBody"
import TitleBar from "components/title-bar/TitleBar"
import { setSavedSafeMode } from "services/Configuration"

const AuthenticatedApp = () => {
  const [applicationContext, setApplicationContext] = useState(DEFAULT_APPLICATION_CONTEXT)

  const setContext = (applicationContext: Context) => {
    setSavedSafeMode(applicationContext.safeMode)
    setApplicationContext(applicationContext)
  }

  return (
    <div className="App">
      <ApplicationContext.Provider value={applicationContext}>
        <Router>
          <Grid container>
            <TitleBar {...applicationContext} setApplicationContext={setContext} />
            <ContentBody />
          </Grid>
        </Router>
      </ApplicationContext.Provider>
    </div>
  )
}

export default AuthenticatedApp
