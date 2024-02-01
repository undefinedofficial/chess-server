import { HttpRequest, HttpResponse } from "uWebSockets.js";
import acceptsBrotli from "./acceptsBrotli";
import serveStatic from "./utils/serveStatic";

const staticFileHandler = async (res: HttpResponse, req: HttpRequest) => {
  const servedStatic = serveStatic(res, req, req.getUrl(), acceptsBrotli(req), true);
  if (servedStatic) return;

  res.writeStatus("404");
  res.end();
  return;
};

export default staticFileHandler;
