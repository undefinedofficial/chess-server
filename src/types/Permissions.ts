type PermissionsUsers = "users.read" | "users.create" | "users.edit" | "users.delete";

type PermissionsRoles = "roles.read" | "roles.create" | "roles.edit" | "roles.delete";

type PermissionsRooms = "rooms.read" | "rooms.create" | "rooms.edit" | "rooms.delete";

type PermissionsQuestions =
  | "question.read"
  | "question.create"
  | "question.edit"
  | "question.delete";
type Permission =
  | PermissionsUsers
  | PermissionsRoles
  | PermissionsRooms
  | PermissionsQuestions;

export { PermissionsUsers, PermissionsRoles, PermissionsRooms, PermissionsQuestions };

export default Permission;
