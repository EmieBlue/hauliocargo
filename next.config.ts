import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * TEMPORARY — remove when the first server feature lands.
   *
   * The landing page is entirely static: no next/image, no server actions, no
   * route handlers, no cookies() or headers(). Exporting to plain files means
   * Netlify serves it straight from the CDN with no Next.js runtime involved —
   * worth having, because that runtime is documented against Next 13.5–15 and
   * this project is on 16.3.4.
   *
   * Registration, booking or anything reading a request must delete this line;
   * `next build` will fail loudly if a server feature is added while it stands.
   */
  output: "export",

  /* The floating dev badge sits over the hero and muddies design review. */
  devIndicators: false,

  /*
   * Lets a phone on the same Wi-Fi load the dev server.
   *
   * Next blocks cross-origin requests to `/_next/*` by default. The server is
   * started on localhost, so without this a device hitting it by IP receives
   * the HTML but a 403 for every script: React never hydrates, and every
   * entrance animation stays frozen at `opacity: 0`. The page looks blank apart
   * from whatever has no animation on it.
   *
   * Wildcarded across the private ranges on purpose — DHCP reassigns this
   * machine's address, and pinning one IP just breaks again a day later. The
   * matcher compares against the origin's *hostname*, so these are bare hosts:
   * no scheme, no port.
   *
   * Dev only; `allowedDevOrigins` is not read by a production build. The
   * trade-off is that any device on the local network can pull dev assets,
   * which is exactly what makes phone testing work.
   */
  allowedDevOrigins: [
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
    "desktop-k9mku4e",
  ],
};

export default nextConfig;
