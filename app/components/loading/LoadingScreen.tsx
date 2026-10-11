import React from "react"
import smallLogo from "~/images/small-logo.svg"

// Full-screen branded splash, styled by the global `.loading-*` rules in index.scss. Shared by
// the root HydrateFallback and the authenticated layout's session check, so a slow API call
// continues the hydration splash instead of swapping it for a different indicator.
export const LoadingScreen = () =>
  <div className="loading-screen">
    <div className="loading-content">
      <div className="loading-logo-container">
        <img src={smallLogo} alt="Video Downloader" className="loading-logo" />
        <div className="loading-ring"></div>
      </div>
      <h1 className="loading-title">Video Downloader</h1>
      <div className="loading-bar-container" role="progressbar" aria-label="Loading">
        <div className="loading-bar"></div>
      </div>
    </div>
  </div>
