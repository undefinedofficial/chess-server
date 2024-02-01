import { us_listen_socket } from "uWebSockets.js";
import { host } from "./configs";

const listenHandler = (listenSocket: us_listen_socket) => {
  if (listenSocket) {
    console.log(
      `\n🔥🔥🔥 Server domain: ${host.DOMAIN}. Ready for Sockets: ${host.PROTO}://${host.HOST}:${host.PORT} 🔥🔥🔥`
    );
  } else {
    console.log(`❌❌❌    Port ${host.PORT} is in use!    ❌❌❌`);
  }
};

export default listenHandler;
