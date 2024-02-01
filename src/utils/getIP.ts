import { HttpRequest, HttpResponse } from "uWebSockets.js";

const getIP = (res: HttpResponse, req: HttpRequest) => {
  const clientIp = req.getHeader("x-forwarded-for");
  if (clientIp) return clientIp;
  return Buffer.from(res.getRemoteAddressAsText()).toString();
};

export default getIP;
