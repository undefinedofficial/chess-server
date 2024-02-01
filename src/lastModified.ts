import { HttpRequest, HttpResponse } from "uWebSockets.js";
import { CacheControl } from "./types/Headers";

const readLastModified = (req: HttpRequest) => req.getHeader("if-modified-since");

const writeLastModified = (res: HttpResponse, mtime: string) => {
  res.writeHeader("Cache-Control", CacheControl.CACHE_WEEK);
  res.writeHeader("Last-Modified", mtime);
};

export default { readLastModified, writeLastModified };
