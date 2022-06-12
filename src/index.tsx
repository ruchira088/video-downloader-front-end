import React from "react"
import ReactClient from "react-dom/client"
import "./index.css"
import App from "./App"
import { Maybe } from "monet"

const container =
  Maybe.fromNull(document.getElementById("root"))
    .orLazy(() => {
      throw new Error("Unable to find element with Id=root")
    })

const root = ReactClient.createRoot(container)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)