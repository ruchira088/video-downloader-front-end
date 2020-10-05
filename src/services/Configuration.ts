import { Maybe } from "monet";

export interface Configuration {
  readonly apiService: string;
  readonly safeMode: boolean;
}

export const configuration: Configuration = {
  apiService: Maybe.fromFalsy(process.env.REACT_APP_API_URL).orLazy(
    () => `https://api.${window.location.hostname}`
  ),
  safeMode: false,
};
