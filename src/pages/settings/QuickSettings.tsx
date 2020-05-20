import React, {Dispatch, SetStateAction} from "react"
import Toggle from "react-toggle"
import {ApplicationContext} from "context/ApplicationContext";

type QuickSettings = ApplicationContext & { setApplicationContext: Dispatch<SetStateAction<ApplicationContext>> }

export default (settings: QuickSettings) => (
    <div className="settings">
        <Toggle checked={settings.safeMode}
                onChange={({target}) => settings.setApplicationContext({safeMode: target.checked})}/>
        {settings.safeMode.toString()}
    </div>
)
