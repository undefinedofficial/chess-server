import { HttpRequest, HttpResponse } from "uWebSockets.js";
import sendToSentry from "./utils/sendToSentry";
import safetyPatchRes from "./safetyPatchRes";

type Methods = "get" | "head" | "post" | "put" | "patch" | "delete";
type Handler = (res: HttpResponse, req: HttpRequest) => any;
interface Handlers {
  get?: Record<string, Handler>;
  head?: Record<string, Handler>;
  post?: Record<string, Handler>;
  put?: Record<string, Handler>;
  patch?: Record<string, Handler>;
  delete?: Record<string, Handler>;
}
export { Handler, Handlers };

function wanderHandlers(handlers: Handlers): Handler {
  return async (res: HttpResponse, req: HttpRequest) => {
    const paths = handlers[req.getMethod() as Methods];
    if (!paths) {
      return req.setYield(true);
    }
    const handler = paths[req.getParameter(0)];
    if (!handler) {
      return req.setYield(true);
    }
    safetyPatchRes(res);
    try {
      await handler(res, req);
      if (!res.done) {
        throw new Error("Async handler did not respond");
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error("uWSAsyncHandler failed");
      sendToSentry(error, {
        tags: { async: "wanderHandlers" },
      });
      res.writeStatus("503").end();
    }
  };
}

export default wanderHandlers;
