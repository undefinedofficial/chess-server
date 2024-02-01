import "uWebSockets.js";

declare module "uWebSockets.js" {
  interface HttpResponse {
    aborted?: boolean;
    done?: boolean;
  }
}
