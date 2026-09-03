/**
 * Prints the URL to open on a phone.
 *
 * `next dev` prints a Network line at startup, but DHCP reassigns this
 * machine's address and that line then goes stale while the server keeps
 * running. Run `npm run url` to get the address as it is right now.
 */
import { networkInterfaces } from "node:os";

const PORT = process.env.PORT ?? "3000";

const addresses = Object.entries(networkInterfaces())
  .flatMap(([name, entries]) =>
    (entries ?? [])
      .filter(
        (entry) =>
          entry.family === "IPv4" &&
          !entry.internal &&
          // Self-assigned addresses mean no DHCP lease — unreachable anyway.
          !entry.address.startsWith("169.254."),
      )
      .map((entry) => ({ name, address: entry.address })),
  )
  // Wi-Fi first: it is almost always the network the phone is also on.
  .sort((a, b) => Number(/wi-?fi|wlan/i.test(b.name)) - Number(/wi-?fi|wlan/i.test(a.name)));

if (addresses.length === 0) {
  console.error("No LAN address found — is this machine on Wi-Fi?");
  process.exit(1);
}

console.log("\n  Open on your phone (same Wi-Fi, with `npm run dev` running):\n");
for (const { name, address } of addresses) {
  console.log(`    http://${address}:${PORT}   (${name})`);
}
console.log("");
