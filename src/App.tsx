import React from "react"
import {Route, BrowserRouter as Router, Switch} from "react-router-dom"
import "./App.css"
import ServiceInformation from "pages/service-information/ServiceInformation"
import Scheduling from "pages/scheduling/Scheduling";
import Videos from "pages/videos/Videos";
import VideoPage from "pages/videos/VideoPage";
import Navigator from "components/Navigator";
import ActiveDownloads from "./pages/scheduling/ActiveDownloads";

export default () => (
    <div className="App">
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
    </div>
)
