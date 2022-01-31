const fs = require("fs");
const dbFile = "users.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
let db;
dbWrapper
  .open({
    filename: dbFile,
    driver: sqlite3.Database,
  })
  .then(async (dBase) => {
    db = dBase;

    try {
      console.log(await db.all("SELECT * from Users"));
      await db.run(
        "CREATE TABLE Users (username TEXT, hash TEXT, permission TEXT)"
      );
    } catch (dbError) {}
  });

// Server script calls these methods to connect to the db
module.exports = {
  // Get the messages in the database
  getUser: async (username) => {
    try {
      return await db.all("SELECT * from Users WHERE username = ?", username);
    } catch (dbError) {
      console.error(dbError);
    }
  },
  // Add new message
  addUser: async (username, hash) => {
    let success = false;
    try {
      success = await db.run(
        "INSERT INTO Users (username,hash,permission) VALUES (?,?,?)",
        [username, hash, 0] // 0: normal user. 1: user with acess to extended features. 2: moderator. 3: admin
      );
    } catch (dbError) {
      console.error(dbError);
    }
    return success.changes > 0 ? true : false;
  },
  updateUser: async (username, permission) => {
    let success = false;
    try {
      success = await db.run(
        "Update Users SET permission = ? WHERE username = ?",
        [permission, username]
      );
    } catch (dbError) {
      console.error(dbError);
    }
    return success.changes > 0 ? true : false;
  },

  //   // Update message text
  //   updateMessage: async (id, message) => {
  //     let success = false;
  //     try {
  //       success = await db.run(
  //         "Update Messages SET message = ? WHERE id = ?",
  //         message,
  //         id
  //       );
  //     } catch (dbError) {
  //       console.error(dbError);
  //     }
  //     return success.changes > 0 ? true : false;
  //   },

  //   // Remove message
  //   deleteMessage: async id => {
  //     let success = false;
  //     try {
  //       success = await db.run("Delete from Messages WHERE id = ?", id);
  //     } catch (dbError) {
  //       console.error(dbError);
  //     }
  //     return success.changes > 0 ? true : false;
  //   }
};
