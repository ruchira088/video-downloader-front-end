import React from "react"
import ServiceInformation from "./pages/service-information/ServiceInformation"
import "./App.css"
import Scheduling from "./pages/scheduling/Scheduling";
import Videos from "./pages/videos/Videos";

export default () => (
    <div className="App">
      <ServiceInformation/>
      <Scheduling/>
      <Videos/>
    </div>
  )
