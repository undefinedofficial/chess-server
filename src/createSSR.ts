import { HttpRequest, HttpResponse } from "uWebSockets.js";
import acceptsBrotli from "./acceptsBrotli";
import RawFile from "./utils/RawFile";

const createSSR = (file: string = "/index.html") => {
  const raw = new RawFile(file);

  return (res: HttpResponse, req: HttpRequest) => {
    if (req.getUrl() === "/not-found") res.writeStatus("404");

    res.writeHeader("content-type", "text/html; charset=utf-8");
    // no need for eTag since file is < 1 MTU
    if (acceptsBrotli(req)) {
      res.writeHeader("content-encoding", "br").end(raw.getBrotliRaw());
    } else {
      res.end(raw.getRaw());
    }
  };
};

export default createSSR;
