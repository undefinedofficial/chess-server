import { App, SSLApp } from "uWebSockets.js";
import { host } from "./configs";

const app =
  host.PROTO === "https"
    ? SSLApp({
        cert_file_name: host.CRT,
        key_file_name: host.KEY,
      })
    : App();

if (host.PROTO === "https") {
  app.addServerName(host.DOMAIN, {
    cert_file_name: host.CRT,
    key_file_name: host.KEY,
  });
}

export default app;
