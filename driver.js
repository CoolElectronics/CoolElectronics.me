const denv = require("dotenv").config();

const {
    MongoClient
} = require("mongodb");
var url = process.env.MONGO_URI;

const client = new MongoClient(url);

let db;
let database;
(async () => {
    db = await client.connect();
    database = await db.db("database");

    console.log("connected to database!");
    makeCol("Users");
    makeCol("Games");
    makeCol("Rooms");
})().catch((err) => console.log(err));

module.exports = {
    getUser: async (username) => {
        try {
            return await database.collection("Users").findOne({
                username: username,
            });
        } catch (err) {
            console.error(err);
        }
    },
    getUsers: async () => {
        try {
            return await database.collection("Users").find({}).toArray();
        } catch (err) {
            console.error(err);
        }
    },

    addUser: async (username, hash) => {
        try {
            return await database.collection("Users").insertOne({
                username: username,
                hash: hash,
                permission: 0,
                friends: [],
                rooms: [],
                online: false,
            });
        } catch (err) {
            console.error(err);
        }
    },
    updateUser: async (username, newusername, permission, friends) => {
        try {
            return await database.collection("Users").updateOne({
                username: username,
            }, {
                $set: {
                    username: newusername,
                    permission: permission,
                    friends: friends,
                },
            });
        } catch (err) {
            console.error(err);
        }
    },
    logUser: async (username, online) => {
        try {
            return await database.collection("Users").updateOne({
                username: username,
            }, {
                $set: {
                    online: online,
                },
            });
        } catch (err) {
            console.error(err);
        }
    },
    removeUser: async (username) => {
        try {
            return await database.collection("Users").deleteOne({
                username: username,
            });
        } catch (err) {
            console.error(err);
        }
    },
    findRoom: async (uuid) => {
        try {
            return await database.collection("Rooms").findOne({
                uuid: uuid,
            });
        } catch (err) {
            console.log(err);
        }
    },
    renameRoom: async (uuid, name) => {
        try {
            return await database.collection("Rooms").updateOne({
                uuid: uuid,
            }, {
                $set: {
                    name: name,
                },
            });
        } catch (err) {
            console.log(err);
        }
    },
    makeRoom: async (uuid, username) => {
        try {
            await database.collection("Rooms").insertOne({
                uuid: uuid,
                name: username,
                owner: username,
                users: [],
                messages: [],
            });
            await module.exports.addUserToRoom(uuid, username);
        } catch (err) {
            console.log(err);
        }
    },
    getAllRooms: async () => {
        try {
            return await database.collection("Rooms").find({}).toArray();
        } catch (err) {
            console.log(err);
        }
    },
    getRoom: async (uuid) => {
        try {
            return await database.collection("Rooms").findOne({
                uuid
            });
        } catch (err) {
            console.log(err);
        }
    },
    addUserToRoom: async (uuid, username) => {
        try {
            let room = await module.exports.findRoom(uuid);
            let oldusers = room.users;
            oldusers.push(username);
            return await database.collection("Rooms").updateOne({
                uuid: uuid,
            }, {
                $set: {
                    users: oldusers,
                },
            });
        } catch (err) {
            console.log(err);
        }
    },
    removeUserFromRoom: async (uuid, username) => {
        try {
            let room = await module.exports.findRoom(uuid);
            return await database.collection("Rooms").updateOne({
                uuid: uuid,
            }, {
                $set: {
                    users: room.users.filter((v) => {
                        return v != username;
                    }),
                },
            });
        } catch (err) {
            console.log(err);
        }
    },
    addMessageToRoom: async (uuid, message) => {
        try {
            let room = await module.exports.findRoom(uuid);
            let messages = room.messages;
            messages.push(message);
            return await database.collection("Rooms").updateOne({
                uuid: uuid,
            }, {
                $set: {
                    messages: messages,
                },
            });
        } catch (err) {
            console.log(err);
        }
    },
    getGames: async () => {
        try {
            return await database.collection("Games").find({}).toArray();
        } catch (e) {
            console.log(e);
        }
    }
};
async function makeCol(name) {
    let collections = await database.listCollections().toArray();
    let collnames = collections.map((c) => c.name);

    if (!collnames.includes(name)) {
        await database.createCollection(name, (err, res) => {
            if (err) throw err;
            console.log(`created collection ${name}`);
        });
    }
}