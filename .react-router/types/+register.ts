import "react-router";

declare module "react-router" {
  interface Register {
    params: Params;
  }

  interface Future {
    unstable_middleware: false
  }
}

type Params = {
  "/": {};
  "/history": {};
  "/video/:videoId": {
    "videoId": string;
  };
  "/service-information": {};
  "/schedule": {};
  "/pending": {};
  "/server-error": {};
  "/sign-in": {};
};