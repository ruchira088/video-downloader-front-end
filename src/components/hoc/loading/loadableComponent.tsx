import React, { ComponentType } from "react";
import { Maybe } from "monet";
import loadingSvg from "./loading.svg";

export const LoadingComponent = () => (
  <>
    <img src={loadingSvg} alt="loading icon" />
  </>
);

export default function loadableComponent<A>(
  Component: ComponentType<A>,
  mayBeValue: Maybe<A>
) {
  return (
    <>
      {mayBeValue.fold(<LoadingComponent />)((values) => (
        <Component {...values} />
      ))}
    </>
  );
}
