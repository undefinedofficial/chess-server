import Permission from "../types/Permissions";

function AllPermissions(): Permission[] {
  return [
    "users.read",
    "users.create",
    "users.edit",
    "users.delete",

    "roles.read",
    "roles.create",
    "roles.edit",
    "roles.delete",

    "rooms.read",
    "rooms.create",
    "rooms.edit",
    "rooms.delete",

    "question.read",
    "question.create",
    "question.edit",
    "question.delete",
  ];
}

export { AllPermissions };

function isPermission(name: string): name is Permission {
  return [
    "users.read",
    "users.create",
    "users.edit",
    "users.delete",

    "roles.read",
    "roles.create",
    "roles.edit",
    "roles.delete",

    "rooms.read",
    "rooms.create",
    "rooms.edit",
    "rooms.delete",

    "question.read",
    "question.create",
    "question.edit",
    "question.delete",
  ].includes(name);
}

export default isPermission;
