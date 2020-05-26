import React, {useState} from "react"
import {BrowserRouter as Router} from "react-router-dom"
import {Grid} from "@material-ui/core"
import "./App.css"
import ApplicationContext, {DEFAULT_CONTEXT} from "context/ApplicationContext"
import Navigator from "components/Navigator";
import QuickSettings from "./pages/settings/QuickSettings";
import MainContainer from "./pages/MainContainer";

export default () => {
    const [applicationContext, setApplicationContext] = useState(DEFAULT_CONTEXT)

    return (
        <div className="App">
            <ApplicationContext.Provider value={applicationContext}>
                <Router>
                    <Grid container>
                        <Grid item xs={9}>Logo</Grid>
                        <Grid item xs={3}>
                            <QuickSettings {...applicationContext} setApplicationContext={setApplicationContext}/>
                        </Grid>
                        <Navigator/>
                        <MainContainer/>
                    </Grid>
                </Router>
            </ApplicationContext.Provider>
        </div>
    )
}
