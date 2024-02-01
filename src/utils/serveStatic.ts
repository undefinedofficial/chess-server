import fs from "fs";
import { HttpRequest, HttpResponse } from "uWebSockets.js";
import pipeStreamOverResponse from "./pipeStreamOverResponse";
import { isCompress, staticPath } from "../configs";
import StaticServer from "./StaticServer";
import lastModified from "../lastModified";

const filesToCache = [
  "/favicon.ico",
  "/favicon.svg",
  "/manifest.json",
  "/robots.txt",
  "/assets/index.css",
];
const staticServer = new StaticServer({
  staticPaths: [staticPath],
  filesToCache,
});

const serveStatic = (
  res: HttpResponse,
  req: HttpRequest,
  fileName: string,
  sendCompressed?: boolean,
  ifmodified?: boolean
) => {
  const meta = staticServer.getMeta(fileName);

  if (!meta) return false;
  const { size, pathname, brotliFile, file, type, mtime } = meta;

  if (ifmodified && mtime === lastModified.readLastModified(req)) {
    res.writeStatus("304 Not Modified").end();
    return true;
  }
  if (file) {
    res.cork(() => {
      res.writeHeader("content-type", type);
      if (ifmodified) lastModified.writeLastModified(res, mtime);
      if (isCompress && sendCompressed && brotliFile) {
        res.writeHeader("content-encoding", "br").end(brotliFile);
      } else {
        res.end(file);
      }
    });
    return true;
  }
  res.writeHeader("content-type", type);
  if (ifmodified) lastModified.writeLastModified(res, mtime);

  const readStream = fs.createReadStream(pathname);
  pipeStreamOverResponse(res, readStream, size);
  return true;
};

export default serveStatic;
