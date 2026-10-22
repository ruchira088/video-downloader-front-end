// A minimal static file server for the end-to-end suite: serves the SPA build and falls back to
// index.html for any path that is not a file, so client-side routes load on a hard navigation.
// Usage: node e2e/static-server.mjs [rootDir] (PORT env var, default 4173)
import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { createServer } from "node:http"
import { extname, join, normalize, resolve, sep } from "node:path"

const root = resolve(process.argv[2] ?? "build/client")
const port = Number(process.env.PORT ?? 4173)

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
}

const isFile = async path => {
  try {
    return (await stat(path)).isFile()
  } catch {
    return false
  }
}

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname)
  const candidate = normalize(join(root, pathname))

  // Anything outside the root, or not a file, gets the SPA shell.
  const filePath =
    (candidate === root || candidate.startsWith(root + sep)) && (await isFile(candidate))
      ? candidate
      : join(root, "index.html")

  response.writeHead(200, {
    "Content-Type": CONTENT_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": "no-store"
  })
  createReadStream(filePath).pipe(response)
})

server.listen(port, () => console.log(`Serving ${root} at http://localhost:${port}`))
