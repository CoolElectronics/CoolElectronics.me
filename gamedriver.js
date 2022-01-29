const fs = require("fs");
const dbFile = "games.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");

const dbname = "Games";

let db;
dbWrapper
    .open({
        filename: dbFile,
        driver: sqlite3.Database
    })
    .then(async dBase => {
        db = dBase;
        try {
            await db.run(
                "CREATE TABLE " + dbname + " (category TEXT, name TEXT, description TEXT, embedurl TEXT)", [dbname]
            );
        } catch (dbError) {
            console.error(dbError);
        }
    });
module.exports = {
    getAll: async () => {
        try {
            return await db.all("SELECT * from ?", dbname);
        } catch (dbError) {
            console.error(dbError);
        }
    },
    getAllInCat: async (cat) => {
        try {
            return await db.all("SELECT * from ? WHERE category = ?", [dbname, cat]);
        } catch (dbError) {
            console.error(dbError);
        }
    },
    getGame: async (name) => {
        try {
            return await db.all("SELECT * from ? WHERE name = ?", [dbname, username]);
        } catch (dbError) {
            console.error(dbError);
        }
    },
    addGame: async (cat, name, desc, embedurl) => {
        let success = false;
        try {
            success = await db.run("INSERT INTO ? (category, name, description, embedurl) VALUES (?,?,?,?)", [
                dbname, cat, name, desc, embedurl
            ]);
        } catch (dbError) {
            console.error(dbError);
        }
        return success.changes > 0 ? true : false;
    },
    updateGame: async (oldname, cat, newname, desc, embedurl) => {
        let success = false;
        try {
            success = await db.run("Update ? SET category = ?, name = ?, description = ?, embedurl = ? WHERE name = ?", [
                dbname, cat, newname, desc, embedurl, oldname
            ]);
        } catch (dbError) {
            console.error(dbError);
        }
        return success.changes > 0 ? true : false;
    }
};