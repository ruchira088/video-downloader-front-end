import React, {Dispatch, SetStateAction} from "react"
import {FormGroup, FormControlLabel, Switch} from "@material-ui/core"
import {ApplicationContext} from "context/ApplicationContext";

export type QuickSettings = ApplicationContext & { setApplicationContext: Dispatch<SetStateAction<ApplicationContext>> }

export default (settings: QuickSettings) => (
    <FormGroup className="settings">
        <FormControlLabel
            control={
                <Switch checked={settings.safeMode}
                        onChange={({target}) => settings.setApplicationContext({safeMode: target.checked})}/>
            }
            label="Safe Mode"/>
    </FormGroup>
)
