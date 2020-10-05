import React, { useState } from "react";
import { Maybe, Some } from "monet";
import { AuthenticationToken } from "./models/AuthenticationToken";
import AuthenticatedApp from "./pages/authenticated/AuthenticatedApp";
import Login from "./pages/unauthenticated/LoginPage";
import { isAuthenticated } from "./services/authentication/AuthenticationService";

export default () => {
  const [authenticationToken, setAuthenticationToken] = useState<
    Maybe<AuthenticationToken>
  >(isAuthenticated());

  if (authenticationToken.isSome()) {
    return <AuthenticatedApp />;
  } else {
    return (
      <Login onAuthenticate={(token) => setAuthenticationToken(Some(token))} />
    );
  }
};
