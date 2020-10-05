import React, { useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Grid } from "@material-ui/core";
import "./AuthenticatedApp.css";
import ApplicationContext, {
  DEFAULT_APPLICATION_CONTEXT,
} from "context/ApplicationContext";
import ContentBody from "components/content-body/ContentBody";
import TitleBar from "components/title-bar/TitleBar";

export default () => {
  const [applicationContext, setApplicationContext] = useState(
    DEFAULT_APPLICATION_CONTEXT
  );

  return (
    <div className="App">
      <ApplicationContext.Provider value={applicationContext}>
        <Router>
          <Grid container>
            <TitleBar
              {...applicationContext}
              setApplicationContext={setApplicationContext}
            />
            <ContentBody />
          </Grid>
        </Router>
      </ApplicationContext.Provider>
    </div>
  );
};
