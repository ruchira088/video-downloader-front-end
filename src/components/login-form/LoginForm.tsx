import React, {useState, ChangeEvent} from "react"
import {Button, TextField} from "@material-ui/core";
import {login} from "services/authentication/AuthenticationService"

export default () => {
    const [password, setPassword] = useState<string>("")

    const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)

    const onLoginClick = () => login(password)

    return (
        <>
            <div>
                <TextField onChange={onPasswordChange} label="Password" value={password}/>
                <Button onClick={onLoginClick} variant="contained" color="primary">
                    Login
                </Button>
            </div>
        </>
    )


}
