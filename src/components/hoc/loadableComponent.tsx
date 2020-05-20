import React, {ComponentType} from "react"
import {Maybe} from "monet";

const LoadingComponent =
    () =>
        <div className="loading">

        </div>

export default function loadableComponent<A>(Component: ComponentType<A>, mayBeValue: Maybe<A>) {
    return (
        <div className="loadable-component">
            {mayBeValue.fold(<LoadingComponent/>)(values => <Component {...values}/>)}
        </div>
    )
}
