import React, { type ComponentType } from "react"
import { Option } from "~/types/Option"
import loadingSvg from "./loading.svg"

export const LoadingComponent = () => (
  <>
    <img src={loadingSvg} alt="loading icon" />
  </>
)

export default function loadableComponent<A extends {}>(Component: ComponentType<A>, mayBeValue: Option<A>) {
  return (
    <>
      {mayBeValue.fold(
        () => <LoadingComponent />,
        (values) => <Component {...values} />
      )
      }
    </>
  )
}
