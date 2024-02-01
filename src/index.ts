import "./database/dbContext";
import { SHARED_COMPRESSOR } from "uWebSockets.js";
import { isReleace, host, security } from "./configs";
import app from "./App";

// import PWAHandler from "./PWAHandler";
// import staticFileHandler from "./staticFileHandler";
// import createSSR from "./createSSR";
import dynamicFileHandler from "./dynamicFileHandler";

import handleUpgrade from "./socketHandlers/handleUpgrade";
import handleOpen from "./socketHandlers/handleOpen";
import handleMessage from "./socketHandlers/handleMessage";
import handleClose from "./socketHandlers/handleClose";

import wanderHandlers from "./wanderHandlers";
import accountHandler from "./api/accountHandler";
import profileHandlers from "./api/profileHandler";
// import secretHandlers from "./api/secretHandler";

import listenHandler from "./listenHandler";
import roomsHandlers from "./roomsHandler";
import avatarFilehandler from "./avatarFileHandler";
if (!isReleace) {
  process.on("SIGINT", async () => {
    process.exit();
  });
}
if (!isReleace) app.get("/shared/*", dynamicFileHandler);
if (!isReleace) app.get("/shared/avatars/:name", avatarFilehandler);
app
  //   .get("/favicon.ico", PWAHandler)
  //   .get("/favicon.svg", PWAHandler)
  //   .get("/manifest.json", PWAHandler)
  //   .get("/robots.txt", PWAHandler)

  //   .get("/assets/*", staticFileHandler)
  //   .get("/logos/*", staticFileHandler)
  //   .get("/*", createSSR())

  /** API */
  // .any("/api/account/:prop", wanderHandlers(accountHandler))
  // .any("/api/profile/:prop", wanderHandlers(profileHandlers))
  // .get("/api/rooms/:prop", roomsHandlers)
  // .any("/*", (res) => res.writeStatus("404").end("Path not exist!"))
  .any("/api/account/:prop", wanderHandlers(accountHandler))
  .any("/api/profile/:prop", wanderHandlers(profileHandlers))
  .get("/api/rooms/", roomsHandlers)
  .get("/api/rooms/:prop", roomsHandlers)
  .any("/*", (res) => res.writeStatus("404").end("Path not exist!"))

  /** Admin */
  // .get("/secret/*", createSSR("/secret/index.html"))
  // .any("/api/secret/:prop", wanderHandlers(secretHandlers))

  .ws("/api/chess", {
    compression: SHARED_COMPRESSOR,
    idleTimeout: 8,
    maxPayloadLength: 5 * 2 ** 20,
    sendPingsAutomatically: true,
    upgrade: handleUpgrade,
    open: handleOpen,
    message: handleMessage,
    // today, we don't send folks enough data to worry about backpressure
    close: handleClose,
  })
  .listen(host.HOST, host.PORT, listenHandler);
