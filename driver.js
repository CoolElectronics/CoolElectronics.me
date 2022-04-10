const denv = require("dotenv").config();
const { v4: uuidv4 } = require("uuid");

const { MongoClient, ObjectId } = require("mongodb");
var url = process.env.MONGO_URI;

const client = new MongoClient(url);
let db;
let database;
module.exports = {
	dbloadcallback: null,
	getFtp: async url => {
		try {
			return await database.collection("Ftp").findOne({
				url: url,
			});
		} catch (err) {
			console.error(err);
		}
	},
	getAllFtp: async () => {
		try {
			return await database.collection("Ftp").find({}).toArray();
		} catch (err) {
			console.error(err);
		}
	},
	updateFtp: async (url, ip) => {
		try {
			let ftp = await module.exports.getFtp(url);
			let viewedtimes = ftp.viewedtimes + 1;
			let ips = ftp.ips;
			ips.push(ip);
			return await database.collection("Ftp").updateOne({
				url
			}, {
				$set: {
					ips,
					viewedtimes
				}
			})
		} catch (err) {
			console.log(err);
		}
	},
	addFtp: async (username, url, filepath) => {
		try {
			let user = await database.collection("Users").findOne({
				username: username
			});
			await database.collection("Ftp").insertOne({
				username,
				url,
				filepath,
				viewedtimes: 0,
				ips: []
			});
			let files = [];
			if (user.files != null) {
				files = user.files;
			}
			files.push(url);
			await database.collection("Users").updateOne({
				username,
			}, {
				$set: {
					files
				}
			});
		} catch (err) {
			console.error(err);
		}
	},
	getUser: async username => {
		try {
			return await database.collection("Users").findOne({
				username: username
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
				permissions: {
					ftp: {}
				},
				friends: [],
				rooms: [],
				online: false,
				worker: null,
				posts: [],
				credits: 0,
			});
		} catch (err) {
			console.error(err);
		}
	},
	updateUser: async (username, mod) => {
		try {
			return await database.collection("Users").updateOne(
				{
					username: username
				}, mod
			);
		} catch (err) {
			console.error(err);
		}
	},
	updateUserSchema: async (username) => {
		try {
			let user = await module.exports.getUser(username);
			if (user.permission != null || user.permissions == null) {
				return await database.collection("Users").updateOne(
					{
						username: username
					},
					{
						$unset: {
							permission: "",
						},
						$set: {
							permissions: {},
						}
					}
				);
			}
		} catch (err) {
			console.error(err);
		}
	},
	logUser: async (username, online) => {
		try {
			return await database.collection("Users").updateOne(
				{
					username: username
				},
				{
					$set: {
						online: online
					}
				}
			);
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
	},
	subscribeUser: async (username, workerobj) => {
		try {
			return await database.collection("Users").updateOne(
				{
					username: username
				},
				{
					$set: {
						worker: workerobj
					}
				}
			);
		} catch (err) {
			console.error(err);
		}
	},
	addComment: async (username, uuid, commenter, comment) => {
		try {
			let user = await module.exports.getUser(username);
			if (user != null) {
				let posts = user.posts;
				posts.find(_ => uuid == _.uuid).comments.push({
					uuid: uuidv4(),
					username: commenter,
					body: comment,
				})

				return await database.collection("Users").updateOne(
					{
						username: username
					},
					{
						$set: {
							posts
						}
					}
				);
			}
		} catch (err) {
			console.error(err);
		}
	},
	addPost: async (username, body) => {
		try {
			let user = await module.exports.getUser(username);
			if (user != null) {
				let posts = user.posts;
				if (posts == null) {
					posts = [];
				}
				posts.push({
					uuid: uuidv4(),
					username,
					body,
					comments: []
				})

				return await database.collection("Users").updateOne(
					{
						username: username
					},
					{
						$set: {
							posts
						}
					}
				);
			}
		} catch (err) {
			console.error(err);
		}
	},
	findRoom: async uuid => {
		try {
			return await database.collection("Rooms").findOne({
				uuid: uuid
			});
		} catch (err) {
			console.log(err);
		}
	},
	renameRoom: async (uuid, name) => {
		try {
			return await database.collection("Rooms").updateOne(
				{
					uuid: uuid
				},
				{
					$set: {
						name: name
					}
				}
			);
		} catch (err) {
			console.log(err);
		}
	},
	changeVisibility: async uuid => {
		try {
			return await database.collection("Rooms").updateOne(
				{
					uuid: uuid
				},
				{
					$set: {
						public: true
					}
				}
			);
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
				public: false
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
	getRoom: async uuid => {
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
			if (!oldusers.includes(username)) {
				oldusers.push(username);
			}
			return await database.collection("Rooms").updateOne(
				{
					uuid: uuid
				},
				{
					$set: {
						users: oldusers
					}
				}
			);
		} catch (err) {
			console.log(err);
		}
	},
	removeUserFromRoom: async (uuid, username) => {
		try {
			let room = await module.exports.findRoom(uuid);
			return await database.collection("Rooms").updateOne(
				{
					uuid: uuid
				},
				{
					$set: {
						users: room.users.filter(v => {
							return v != username;
						})
					}
				}
			);
		} catch (err) {
			console.log(err);
		}
	},
	addMessageToRoom: async (uuid, message) => {
		try {
			let room = await module.exports.findRoom(uuid);
			let messages = room.messages;
			messages.push(message);
			return await database.collection("Rooms").updateOne(
				{
					uuid: uuid
				},
				{
					$set: {
						messages: messages
					}
				}
			);
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
	},
	addCollection: async name => {
		try {
			return await database.collection("Games").insertOne({
				name: name,
				games: []
			});
		} catch (e) {
			console.log(e);
		}
	},
	deleteCollection: async id => {
		try {
			return await database.collection("Games").deleteOne({
				_id: new ObjectId(id)
			});
		} catch (e) {
			console.log(e);
		}
	},
	addGame: async (id, name, url) => {
		try {
			let oldgames = await database.collection("Games").findOne({
				_id: new ObjectId(id)
			});
			let newgames = oldgames.games;
			newgames.push({
				name,
				url
			});
			return await database.collection("Games").updateOne(
				{
					_id: new ObjectId(id)
				},
				{
					$set: {
						games: newgames
					}
				}
			);
		} catch (e) {
			console.log(e);
		}
	},
	deleteGame: async (id, name) => {
		try {
			console.log("id is " + id);
			let games = await database.collection("Games").findOne({
				_id: new ObjectId(id)
			});
			return await database.collection("Games").updateOne(
				{
					_id: new ObjectId(id)
				},
				{
					$set: {
						games: games.games.filter(game => {
							return game.name != name;
						})
					}
				}
			);
		} catch (e) {
			console.log(e);
		}
	},
	addFrc: async data => {
		try {
			return await database.collection("Frcdata").insertOne(data);
		} catch (err) {
			console.error(err);
		}
	}
};
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
(async () => {
	db = await client.connect();
	database = await db.db("database");

	console.log("connected to database!");
	makeCol("Users");
	makeCol("Games");
	makeCol("Rooms");
	// makeCol("Frcdata");
	makeCol("Ftp");
	if (module.exports.dbloadcallback != null) {
		module.exports.dbloadcallback();
	}
})().catch(err => console.log(err));
