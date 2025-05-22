import { index, layout, route, type RouteConfig } from "@react-router/dev/routes"

export default [
  layout("pages/authenticated/AuthenticatedLayout.tsx", [
    index("pages/authenticated/videos/Videos.tsx"),
    route("/history", "pages/authenticated/history/HistoryPage.tsx"),
    route("/video/:videoId", "pages/authenticated/videos/video-page/VideoPage.tsx"),
    route("/service-information", "pages/authenticated/service-information/ServiceInformation.tsx"),
    route("/schedule", "pages/authenticated/schedule/Schedule.tsx"),
    route("/pending", "pages/authenticated/pending/ScheduledVideos.tsx"),
    route("/server-error", "pages/authenticated/server-error/ServerErrorPage.tsx")
  ]),
  layout("pages/unauthenticated/UnauthenticatedLayout.tsx", [
    route("/sign-in", "pages/unauthenticated/login/LoginPage.tsx")
  ])
] satisfies RouteConfig

