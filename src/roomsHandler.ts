import { HttpRequest, HttpResponse } from "uWebSockets.js";
import sendToSentry from "./utils/sendToSentry";
import safetyPatchRes from "./safetyPatchRes";
import dbContext from "./database/dbContext";
import { Groups } from "./types/DataProto";
import WSGroups from "./WSGroups";
import sendHttpRes from "./sendHttpRes";
import roomsToJSON from "./utils/roomToJSON";

async function GetRoomsRandom(res: HttpResponse, _req: HttpRequest) {
  const dbrooms = await dbContext.Rooms.find({ id: { $regex: /^o\S+/, $options: "i" } })
    .populate(["white", "black"])
    .limit(5)
    .sort({ createdAt: -1 })
    .lean();

  return sendHttpRes(res, 200, JSON.stringify(roomsToJSON(dbrooms as any)), {
    "content-type": "application/json",
  });
}
async function GetRoomById(res: HttpResponse, _req: HttpRequest, id: string) {
  if (id[0] !== "b" && id[0] !== "o") return sendHttpRes(res, 404, "room invalid!");

  const room = WSGroups.getGameRoom(id);
  if (room)
    return sendHttpRes(res, 200, JSON.stringify(roomsToJSON(room.GetRoom())), {
      "content-type": "application/json",
    });

  const dbroom = await dbContext.Rooms.findOne({ id }).populate(["white", "black"]);
  if (dbroom) {
    return sendHttpRes(res, 200, JSON.stringify(roomsToJSON(dbroom as any)), {
      "content-type": "application/json",
    });
  }
  sendHttpRes(res, 404, "room not exist!");
}

async function roomsHandlers(res: HttpResponse, req: HttpRequest) {
  const id = req.getParameter(0) as Groups;
  safetyPatchRes(res);
  try {
    if (id) await GetRoomById(res, req, id);
    else await GetRoomsRandom(res, req);
    if (!res.done) {
      throw new Error("Async handler did not respond");
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error("uWSAsyncHandler failed");
    sendToSentry(error, {
      tags: { async: "roomsHandlers" },
    });
    sendHttpRes(res, 503);
  }
}

export default roomsHandlers;
