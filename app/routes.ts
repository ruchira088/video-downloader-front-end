import { index, layout, route, type RouteConfig } from "@react-router/dev/routes"

export default [
  layout("pages/authenticated/AuthenticatedLayout.tsx", [
    index("pages/authenticated/videos/Videos.tsx"),
    route("/history", "pages/authenticated/history/HistoryPage.tsx"),
    route("/video/:videoId", "pages/authenticated/videos/video-page/VideoPage.tsx"),
    route("/information", "pages/authenticated/service-information/ServiceInformation.tsx"),
    route("/schedule", "pages/authenticated/schedule/Schedule.tsx"),
    route("/downloading", "pages/authenticated/downloading/ScheduledVideos.tsx"),
    route("/server-error", "pages/authenticated/server-error/ServerErrorPage.tsx"),
    route("/playlists", "pages/authenticated/playlists/Playlists.tsx"),
    route("/playlists/:playlistId", "pages/authenticated/playlists/PlaylistDetail.tsx")
  ]),
  layout("pages/unauthenticated/UnauthenticatedLayout.tsx", [
    route("/sign-in", "pages/unauthenticated/login/LoginPage.tsx"),
    route("/sign-up", "pages/unauthenticated/signup/SignupPage.tsx")
  ])
] satisfies RouteConfig

