import { db } from "../configs";
import mongoose, { connect } from "mongoose";
import { AllPermissions } from "../utils/isPermission";

import User from "./models/User";
import Role from "./models/Role";
import Question from "./models/Question";
import Room from "./models/Room";

interface dbContextOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

class dbContext {
  private roles = Role;
  public get Roles() {
    return this.roles;
  }
  private users = User;
  public get Users() {
    return this.users;
  }
  private questions = Question;
  public get Questions() {
    return this.questions;
  }
  private rooms = Room;
  public get Rooms() {
    return this.rooms;
  }

  constructor({ host, port, database, username, password }: dbContextOptions) {
    mongoose.set("strictQuery", false);
    // Connection URL
    connect(`mongodb://${host}:${port}`, {
      user: username,
      pass: password,
      dbName: database,
    })
      .then(async () => {
        console.log("DB connect:", database);
        await this.InitDatabase();
      })
      .catch((e) => {
        throw new Error("dbContext error: " + e.message);
      });
  }

  private async InitDatabase() {
    let role = await this.Roles.findOne({ name: "Admin" });
    let admin = await this.Users.findOne({ email: "boss.kir03@mail.ru" }).populate("role");

    async function SetRole() {
      if (admin) {
        admin.role = role;
        await admin.save();
      }
    }
    if (admin?.role?.name !== role?.name) {
      await SetRole();
    }

    if (!role || !admin) {
      console.log("Init Database");

      if (!role) {
        role = await this.Roles.create({
          name: "Admin",
          description: "Admin role (created automaticly)",
          permissions: AllPermissions(),
        });
        await SetRole();
        console.log("Role Admin created");
      }

      if (!admin) {
        if (!role) throw new Error("Role admin not found for admin user");
        admin = await this.Users.create({
          email: "boss.kir03@mail.ru",
          nickname: "admin",
          password: "Ub9bu)*&^vb",
          location: "ru",
          role,
          confirmed: true,
        });
        console.log("User Admin created");
      }
    }
  }
}

export default new dbContext({
  host: db.HOST,
  port: db.PORT,
  database: db.NAME,
  username: db.USER,
  password: db.PASS,
});
