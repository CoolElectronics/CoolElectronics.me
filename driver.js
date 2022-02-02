const {
    MongoClient
} = require('mongodb');
var url = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.1.9";

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

})().catch(err => console.log(err));

module.exports = {
    getUser: async username => {
        try {
            return await database.collection("Users").findOne({
                username: username
            });
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
                friends: []
            });
        } catch (err) {
            console.error(err);
        }
    },
    updateUser: async (username, newusername, permission, friends) => {
        try {
            return await database.collection("Users").updateOne({
                username: username
            }, {
                $set: {
                    username: newusername,
                    permission: permission,
                    friends: friends
                }
            });
        } catch (err) {
            console.error(err);
        }
    },
    removeUser: async username => {
        try {
            return await database.collection("Users").deleteOne({
                username: username
            });
        } catch (err) {
            console.error(err);
        }
    }
}
async function makeCol(name) {
    let collections = await database.listCollections().toArray();
    let collnames = collections.map(c => c.name);

    if (!collnames.includes(name)) {
        await database.createCollection(name, (err, res) => {
            if (err) throw err;
            console.log(`created collection ${name}`);
        });
    }
}