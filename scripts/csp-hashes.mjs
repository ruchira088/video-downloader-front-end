import { writeFile, rm } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"
import { JSDOM } from "jsdom"

const sha256Base64 = textContent => createHash("sha256").update(textContent, "utf8").digest("base64")

const getInlineScriptHashes = async () => {
  const dom = await JSDOM.fromFile(path.join(import.meta.dirname, "..", "build", "client", "index.html"))
  const scripts = Array.from(dom.window.document.querySelectorAll("script"))

  return scripts
    .map(script => sha256Base64(script.textContent))
    .map(hash => `'sha256-${hash}'`)
}

const generateCspConfig = async () => {
  const cspConfigFile = path.join(import.meta.dirname, "..", "build", "csp.conf")

  const scriptHashes = await getInlineScriptHashes()
  const apiHosts = ["https://*.ruchij.com", "localhost", "*.localhost"]

  const cspConfig = [
    "default-src 'self'",
    `script-src 'self' ${scriptHashes.join(" ")}`,
    `connect-src 'self' ${apiHosts.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' ${apiHosts.join(" ")} data: blob:`,
    `media-src 'self' ${apiHosts.join(" ")}`,
    "font-src 'self' https://fonts.gstatic.com",
    "frame-ancestors 'none'"
  ]

  const nginxCspConfig = `add_header Content-Security-Policy "${cspConfig.join("; ")}" always;`

  await rm(cspConfigFile, { force: true })
  await writeFile(cspConfigFile, nginxCspConfig, "utf8")
}

generateCspConfig()