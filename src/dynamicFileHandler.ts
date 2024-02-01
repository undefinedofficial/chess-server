import { HttpRequest, HttpResponse } from "uWebSockets.js";
import path from "path";
import { Stats, createReadStream, statSync } from "fs";
import { resourcePath } from "./configs";
import pipeStreamOverResponse from "./utils/pipeStreamOverResponse";
import mime_types from "./utils/mime-types";
import lastModified from "./lastModified";

const dynamicFileHandler = async (res: HttpResponse, req: HttpRequest) => {
  const url = resourcePath + req.getUrl();
  let stats: Stats;
  try {
    stats = statSync(url);

    const { size, mtime } = stats;
    const lastTime = mtime.toUTCString();
    const ifModified = lastModified.readLastModified(req);

    if (ifModified === lastTime)
      return res.writeStatus("304 Not Modified").end();

    const ext = path.extname(url).slice(1);
    const contentType = mime_types[ext] ?? "application/octet-stream";
    res.writeHeader("content-type", contentType);
    lastModified.writeLastModified(res, lastTime);

    const readStream = createReadStream(url);
    pipeStreamOverResponse(res, readStream, size);
  } catch (e) {
    return res.writeStatus("404").end();
  }
};

export default dynamicFileHandler;
