import React, {useState} from "react"
import {BrowserRouter as Router, Route, Switch} from "react-router-dom"
import "./App.css"
import ApplicationContext, {DEFAULT_CONTEXT} from "context/ApplicationContext"
import ServiceInformation from "pages/service-information/ServiceInformation"
import Scheduling from "pages/scheduling/Scheduling";
import Videos from "pages/videos/Videos";
import VideoPage from "pages/videos/VideoPage";
import Navigator from "components/Navigator";
import ActiveDownloads from "./pages/scheduling/ActiveDownloads";
import QuickSettings from "./pages/settings/QuickSettings";

export default () => {
    const [applicationContext, setApplicationContext] = useState(DEFAULT_CONTEXT)

    return (
        <div className="App">
            <QuickSettings {...applicationContext} setApplicationContext={setApplicationContext}/>
            <ApplicationContext.Provider value={applicationContext}>
                <Router>
                    <Navigator/>
                    <Switch>
                        <Route exact path="/">
                            <Videos/>
                        </Route>
                        <Route path="/video/:videoId">
                            <VideoPage/>
                        </Route>
                        <Route path="/service-information">
                            <ServiceInformation/>
                        </Route>
                        <Route path="/schedule">
                            <Scheduling/>
                        </Route>
                        <Route path="/active">
                            <ActiveDownloads/>
                        </Route>
                        <Route path="*">
                        </Route>
                    </Switch>
                </Router>
            </ApplicationContext.Provider>
        </div>
    )
}
