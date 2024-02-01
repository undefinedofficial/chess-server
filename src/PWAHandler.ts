import { HttpRequest, HttpResponse } from "uWebSockets.js";
import acceptsBrotli from "./acceptsBrotli";
import serveStatic from "./utils/serveStatic";

const PWAHandler = (res: HttpResponse, req: HttpRequest) => {
  serveStatic(res, req, req.getUrl(), acceptsBrotli(req), true);
};
export default PWAHandler;
