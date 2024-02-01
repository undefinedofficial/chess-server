import { HttpRequest, HttpResponse } from "uWebSockets.js";
import { createReadStream, statSync } from "fs";
import { avatarsPath, resourcePath } from "./configs";
import pipeStreamOverResponse from "./utils/pipeStreamOverResponse";
import lastModified from "./lastModified";

const avatarFilehandler = async (res: HttpResponse, req: HttpRequest) => {
  function sendAvatar(file: string = "defaultman") {
    const fullpath = avatarsPath + file;
    const { size, mtime } = statSync(fullpath);
    const lastTime = mtime.toUTCString();
    const ifModified = lastModified.readLastModified(req);

    if (ifModified === lastTime) return res.writeStatus("304 Not Modified").end();

    res.writeHeader("content-type", "image/png");
    lastModified.writeLastModified(res, lastTime);

    const readStream = createReadStream(fullpath);
    pipeStreamOverResponse(res, readStream, size);
  }

  try {
    const nickname = req.getParameter(0);
    sendAvatar(nickname);
  } catch (e) {
    sendAvatar();
  }
};

export default avatarFilehandler;
