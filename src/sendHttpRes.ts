import { HttpResponse, RecognizedString } from "uWebSockets.js";
import { CacheControl } from "./types/Headers";

const setupCors = (res: HttpResponse, origin: string) => {
  res
    .writeHeader("Access-Control-Allow-Origin", origin)
    .writeHeader("Access-Control-Allow-Credentials", "true")
    .writeHeader(
      "Access-Control-Allow-Headers",
      "origin, content-type, accept, authorization, Set-Cookie"
    )
    .writeHeader("Access-Control-Max-Age", "2592000")
    .writeHeader("Vary", "Origin");
};

function sendHttpRes(
  res: HttpResponse,
  code = 200,
  message?: RecognizedString,
  headers?: Record<string, RecognizedString>,
  cors?: boolean
) {
  res.cork(() => {
    res.writeStatus(code.toString());

    if (cors) setupCors(res, "*");

    if (headers) {
      Object.keys(headers).forEach((k) => {
        res.writeHeader(k, headers[k]);
      });
    }
    res.writeHeader("cache-control", CacheControl.NO_CACHE);
    res.end(message);
  });
}

export default sendHttpRes;
