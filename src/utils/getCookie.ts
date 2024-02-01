import { HttpRequest } from "uWebSockets.js";

function getCookie(req: HttpRequest, key: string) {
  const cookie = req.getHeader("cookie");

  if (cookie.indexOf(key) === -1) return "";
  const arr = cookie.split(";").map((v) => v.trim());

  for (let i = 0; i < arr.length; i++) {
    const kv = arr[i].split("=");
    if (kv[0] === key) return kv[1];
  }
  return "";
}
export default getCookie;
