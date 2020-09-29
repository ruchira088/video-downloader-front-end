import React, {useState} from "react"
import {BrowserRouter as Router} from "react-router-dom"
import {Grid} from "@material-ui/core"
import "./App.css"
import ApplicationContext, {DEFAULT_APPLICATION_CONTEXT} from "context/ApplicationContext"
import ContentBody from "components/content-body/ContentBody";
import TitleBar from "components/title-bar/TitleBar";
import {isAuthenticated} from "./services/authentication/AuthenticationService";
import {Maybe} from "monet";
import {AuthenticationToken} from "./models/AuthenticationToken";

export default () => {
    const [applicationContext, setApplicationContext] = useState(DEFAULT_APPLICATION_CONTEXT)
    const [authenticationToken, setAuthenticationToken] = useState<Maybe<AuthenticationToken>>(isAuthenticated())

    console.log(authenticationToken)

    return (
        <div className="App">
            <ApplicationContext.Provider value={applicationContext}>
                <Router>
                    <Grid container>
                        <TitleBar {...applicationContext} setApplicationContext={setApplicationContext}/>
                        <ContentBody/>
                    </Grid>
                </Router>
            </ApplicationContext.Provider>
        </div>
    )
}
