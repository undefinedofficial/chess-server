import GroupContext from "./GroupContext";
import IGameGroupContext from "./IGameGroupContext";

function isGameRoom(group: GroupContext): group is IGameGroupContext<any> {
  return group?.id[0] === "b" || group?.id[0] === "o";
}

export default isGameRoom;
