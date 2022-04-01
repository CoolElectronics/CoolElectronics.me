const port = 8080;
const saltRounds = 10;

const messagefetchbuffer = 20;
var userloggingbuffer = {};
fix games
//#region requires
const jwt = require("jsonwebtoken");
const express = require("express");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const fs = require("fs");
const http = require("http");
const https = require("https");
const cookieJson = require("cookie");
const bcrypt = require("bcrypt");
const webpush = require("web-push");

const fileUpload = require("express-fileupload");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const _ = require("lodash");

const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const xss = require("xss");
const axios = require("axios");
const denv = require("dotenv").config();
const driver = require("./driver.js");
const formidable = require('formidable');
// const { fastmap } = require("./util.js");
//#endregion
//#region middleware

try {
	webpush.setVapidDetails(
		"mailto:kveonl98@gmail.com",
		process.env.PUSH_PUB,
		process.env.PUSH_PRIV
	);
} catch {

}
const res = require("express/lib/response");
const req = require("express/lib/request");
const { addMessageToRoom } = require("./driver.js");
const app = express();

const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(
	fileUpload({
		createParentPath: true
	})
);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(morgan('dev'));

app.use(compression());
app.use(express.json())
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
//#endregion
//#region gets
app.get("/api/me", (req, res) => {
	Validate(
		req.cookies,
		1,
		user => {
			res.status(200).send({
				username: user.username,
				permission: user.permission,
			})
		}
		, _ => res.status(400), _ => _
	);
});
app.get("/api/games", (req, res) => {
	driver.getGames().then(data => {
		res.send(data);
	});
});
app.get("/api/admin", (req, res) => {
	Validate(
		req.cookies,
		3,
		usr => {
			driver.getUsers().then(users => {
				res.send(users);
			});
		},
		_ => console.log("err"),
		_ => _
	);
});
// socket.on("feed", req => {
// 	switch (req.type) {
// 		case "post":
// 			Validate(
// 				parse(socket.request.headers.cookie),
// 				0,
// 				usr => {
// 					driver.addPost(usr.username, req.body).then(() => {
// 						UpdatePosts(socket);
// 					})
// 				},
// 				_ => console.log("err"),
// 				_ => _
// 			);
// 			break;
// 		case "comment":
// 			Validate(
// 				parse(socket.request.headers.cookie),
// 				0,
// 				usr => {
// 					driver.addComment(req.username, req.uuid, usr.username, req.comment).then(() => {
// 						// UpdatePosts(socket);
// 					})
// 				},
// 				_ => console.log("err"),
// 				_ => _
// 			);
// 			break;
// 		case "getposts":
// 			UpdatePosts(socket);
// 			break;
// 		case "showmore":
// 			UpdatePosts(socket, req.offset, true);
// 			break;
// 		case "render":
// 			Validate(
// 				parse(socket.request.headers.cookie),
// 				0,
// 				usr => {
// 					if (!usr.worker) {
// 						console.log("attempting to reassign worker");
// 						socket.emit("subscribe");
// 					}
// 					socket.emit("feed", {
// 						type: "render",
// 						username: usr.username,
// 						permission: usr.permission
// 					});
// 					UpdateUserlist();
// 				},
// 				_ => console.log("err"),
// 				_ => _
// 			);
// 			break;
// 		case "admin":
// 			Validate(
// 				parse(socket.request.headers.cookie),
// 				3,
// 				usr => {
// 					driver.getUsers().then(users => {
// 						socket.emit("feed", {
// 							type: "admin",
// 							username: usr.username,
// 							permission: usr.permission,
// 							users: users
// 							// this will transmit the hashes. its ok bc this will only ever get sent to an administrator but still be careful
// 						});
// 					});
// 				},
// 				_ => console.log("err"),
// 				_ => _
// 			);
// 			break;
// 	}
// });
//#endregion
//#region posts
app.post("/subscribe", (req, res) => {
	Validate(req.cookies, 0, user => {
		const subscription = req.body;
		res.status(201).json({});
		console.log("subscribing new user");
		driver.subscribeUser(user.username, subscription);
	});
});
app.post("/api/signup", (req, res) => {
	var username = xss(req.body.username);
	bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
		driver.getUser(username).then(v => {
			if (v != null) {
				res.send({
					success: false,
					reason: "there is already an account with that username"
				});
			} else {
				console.log("account made");
				driver.addUser(req.body.username, hash);
				res.cookie("token", Auth(req.body.username), { maxAge: 9999990, httpOnly: false, sameSite: "strict" });
				res.send({
					success: true,
				});
			}
		});
	});
	try {
		res.render();
	} catch (e) {
		// express bug in how cookies are sent to client. this fixes it for some unfathomable reason 
	}
});
app.post("/api/signin", (req, res) => {
	var username = req.body.username;
	driver
		.getUser(username)
		.then(usr => {
			if (usr) {
				bcrypt.compare(req.body.password, usr.hash, (err, hashres) => {
					if (hashres) {
						console.log(username + " logged in");
						res.cookie("token", Auth(usr.username), { maxAge: 9999990, httpOnly: false, sameSite: "strict" });
						res.send({
							success: true
						});
					} else {
						res.send({
							success: false,
							reason: "incorrect password"
						});
					}
				});
			} else {
				res.send({
					success: false,
					reason: "that user does not exist"
				});
			}
		})
		.catch(e => {
			console.log(e);
		});
	try {
		res.render();
	} catch (e) {
	}
});
app.post("/api/games", (req, res) => {
	Validate(
		req.cookies,
		2,
		usr => {
			driver.getUsers().then(users => {
				switch (req.body.type) {
					case "addcollection":
						driver.addCollection(req.body.name);
						break;
					case "deletecollection":
						driver.deleteCollection(req.body.id);
						break;
					case "addgame":
						driver.addGame(req.body.collection, req.body.name, req.body.url)
						break;
					case "deletegame":
						driver.deleteGame(req.body.collection, req.body.name);
						break;
				}
				res.status(200);
			});
		},
		_ => console.log("err"),
		_ => _
	);
});
app.post("/api/admin", (req, res) => {
	Validate(
		req.cookies,
		4,
		async user => {
			switch (req.body.type) {
				case "crd":
					try {
						let res = await axios.get(process.env.HOST_IP + "/api/crd");
						res.send(`sent request to local server. response was ${res.data}`);
					} catch (e) {
						res.send(e.stack);
					}
					break;
				case "mc":
					try {
						let res2 = await axios.get(process.env.HOST_IP + "/api/mc");
						res.send(`sent request to local server. response was ${res2.data}`);
					} catch (e) {
						res.send(e.stack);
					}
				case "updatepermission":
					await driver.updatePermission(req.body.username, req.body.permission);
					res.status(200);
					break;
			}
		},
		_ => _,
		_ => _
	);
});
app.post("/api/upload", async (req, res) => {
	Validate(
		req.cookies,
		0,
		user => {
			try {
				if (!req.files) {
					res.send({
						status: false,
						message: "No file uploaded"
					});
				} else {
					let avatar = req.files.file;
					if (avatar.mimetype == "image/png" || avatar.mimetype == "image/jpeg") {
						if (avatar.size < 8000000) {
							avatar.mv("./public/img/" + user.username + "/pfp.png");
							res.send({
								status: true,
								message: "File is uploaded"
							});
						} else {
							res.send({
								status: false,
								message: "sorry, thats too big"
							});
						}
					} else {
						res.send({
							status: false,
							message: "that... doesn't look like an image"
						});
					}
				}
			} catch (err) {
				console.log(err);
				res.status(500).send(err);
			}
		},
		_ => _,
		_ => _
	);
});
//#endregion
//#region public endpoints 
app.get("/", function (req, res) {
	Validate(
		req.cookies,
		0,
		_ => res.redirect("/home"),
		_ => res.render("pages/index"),
		_ => _
	);
});
app.get("/chat", (req, res) => {
	Validate(
		req.cookies,
		1,
		_ => res.render("pages/chat"),
		_ => res.redirect("/sign"),
		_ => res.redirect("/forbidden")
	);
});
app.get("/home", (req, res) => {
	Validate(
		req.cookies,
		0,
		_ => {
			res.render("pages/home")
		},
		_ => res.redirect("/sign"),
		_ => res.redirect("/forbidden")
	);
});
app.get("/profile", (req, res) => {
	Validate(
		req.cookies,
		4,
		_ => res.redirect("/home"),
		_ => res.redirect("/sign"),
		_ => res.redirect("/forbidden")
	);
});
app.get("/network", (req, res) => {
	Validate(
		req.cookies,
		1,
		_ => res.render("pages/network"),
		_ => res.redirect("/sign"),
		_ => res.redirect("/forbidden")
	);
});
app.get("/admin", (req, res) => {
	Validate(
		req.cookies,
		4,
		_ => res.render("pages/admin"),
		_ => res.redirect("/sign"),
		_ => res.redirect("/forbidden")
	);
});
app.get("/sign", function (req, res) {
	Validate(
		req.cookies,
		0,
		_ => res.redirect("/chat"),
		_ => res.render("pages/sign"),
		_ => _
	);
});
app.get("/games", function (req, res) {
	res.render("pages/games");
});
app.get("/frc", function (req, res) {
	res.render("pages/frc");
});
app.get("/forbidden", function (req, res) {
	res.render("pages/forbidden");
});
//#endregion
//#region sockets
io.on("connection", async socket => {
	let cookies = parse(socket.request.headers.cookie);
	Validate(
		cookies,
		0,
		_ => {
			if (userloggingbuffer[_.username] != null) {
				clearTimeout(userloggingbuffer[_.username]);
			}
			ldb.addItem(socket.id, _.username);
		},
		_ => {
			ldb.addItem(socket.id, null);
		},
		_ => _
	);
	UserIsOnline(socket);
	socket.on("disconnect", () => {
		ldb.delete(socket.id);
		Validate(
			cookies,
			0,
			user => {
				if (userloggingbuffer[user.username] != null) {
					clearTimeout(userloggingbuffer[user.username]);
				}
				userloggingbuffer[user.username] = setTimeout(() => {
					console.log("logging user");
					driver.logUser(user.username, false).then(_ => {
						UpdateUserlist();
					});
				}, 5000);
				//bad fix but whatrever
			},
			_ => _,
			_ => _
		);
	});
	socket.on("alive", () => {
		UserIsOnline(socket);
	});
	socket.on("chat", async req => {
		Validate(
			parse(socket.request.headers.cookie),
			0,
			usr => {
				switch (req.type) {
					case "friend":
						if (usr.username != req.username) {
							// user is the user data of the function caller
							driver
								.getUser(req.username)
								.then(async target => {
									// target is the target
									if (target != null) {
										if (!usr.friends.includes(target.username)) {
											let friends = usr.friends;
											friends.push(target.username);
											await driver.updateUser(
												usr.username,
												usr.username,
												usr.permission,
												friends
											);
											friends = target.friends;
											friends.push(usr.username);
											await driver.updateUser(
												target.username,
												target.username,
												target.permission,
												friends
											);
											socket.emit("chat", {
												type: "friend",
												result: true
											});
											UpdateUserlist();
										} else {
											await driver.updateUser(
												usr.username,
												usr.username,
												usr.permission,
												usr.friends.filter(v => {
													return v != target.username;
												})
											);
											await driver.updateUser(
												target.username,
												target.username,
												target.permission,
												target.friends.filter(v => {
													return v != usr.username;
												})
											);
											socket.emit("chat", {
												type: "friend",
												result: true
											});
											UpdateUserlist();
										}
									} else {
										socket.emit("chat", {
											type: "friend",
											result: false,
											error: "That user does not exist!"
										});
									}
								})
								.catch(e => console.log(e));
						} else {
							socket.emit("chat", {
								type: "friend",
								result: false,
								error: "Sorry, you can't be friends with yourself :("
							});
						}

						break;
					case "newroom":
						driver.makeRoom(uuidv4(), usr.username).then(() => {
							UpdateUserlist();
						});
						break;
					case "dm":
						let roomuuid = uuidv4();
						driver.makeRoom(roomuuid, usr.username).then(() => {
							driver.renameRoom(roomuuid, "DM with " + req.username).then(() => {
								driver.addUserToRoom(roomuuid, req.username).then(() => {
									UpdateUserlist();
								});
							});
						});
						break;
					case "adduser":
						driver.addUserToRoom(req.uuid, req.username).then(() => UpdateUserlist());
						break;
					case "removeuser":
						driver
							.removeUserFromRoom(req.uuid, req.username)
							.then(() => UpdateUserlist());
						break;
					case "rename":
						driver.getRoom(req.uuid).then(room => {
							if (usr.username == room.owner) {
								driver.renameRoom(req.uuid, xss(req.newname));
								UpdateUserlist();
							}
						});
						break;
					case "send":
						let sanitizedmessage = xss(req.message);
						if (sanitizedmessage != "") {
							let messageobj = {
								type: "message",
								sender: usr.username,
								message: sanitizedmessage,
								messageuuid: uuidv4(), // are you happy now?
								roomuuid: req.uuid
							};
							UpdateMessages(req.uuid, messageobj);
							driver.addMessageToRoom(req.uuid, messageobj);
						}
						break;
					// case "roomrequest":
					//   driver.findRoom(req.uuid).then((room) => {
					//     socket.emit("chat", {
					//       type: "massmessage",
					//       messages: room.messages,
					//     });
					//   });
					//   break;
					case "leave":
						driver.removeUserFromRoom(req.uuid, usr.username).then(() => {
							UpdateUserlist();
						});
						break;
					case "changevisibility":
						driver.getRoom(req.uuid).then(room => {
							if (usr.username == room.owner) {
								driver.changeVisibility(req.uuid);
							}
						});
						break;
					case "requestpublicrooms":
						driver.getAllRooms().then(rooms => {
							socket.emit("chat", {
								type: "requestpublicrooms",
								rooms: rooms.filter(_ => {
									return _.public;
								})
							});
						});
						break;
					case "joinroom":
						driver.getRoom(req.uuid).then(room => {
							if (room.public) {
								driver.addUserToRoom(req.uuid, usr.username).then(_ => {
									UpdateUserlist();
								});
							}
						});
						break;
					case "fetch":
						driver.getRoom(req.uuid).then(room => {
							if (room.users.includes(usr.username)) {
								socket.emit("chat", {
									type: "fetch",
									uuid: req.uuid,
									messages: room.messages.slice(room.messages.length - req.offset - 1 - messagefetchbuffer, room.messages.length - req.offset),
									offset: req.offset + messagefetchbuffer
								})
							}
						});
						break;
					default:
						console.log("could not parse type " + res.type);
				}
			},
			_ => {
				socket.emit("chat", {
					type: req.type,
					result: false,
					error: "You are not a valid user?"
				});
			},
			_ => _
		);
	});
});
//#endregion
httpServer.listen(port, () => {
	console.log(`HTTP Server running on port ${port}`);
});
//#region methods
function Auth(username) {
	let token = jwt.sign({ username: username }, process.env.JWT, {
		algorithm: "HS256"
	});
	return token;
}
function Validate(cookies, perm, success, failiure, denied) {
	var payload;
	if (cookies != null) {
		if (cookies.token != null) {
			try {
				payload = jwt.verify(cookies.token, process.env.JWT, {
					algorithm: "HS256"
				});
			} catch (e) {
				return failiure();
			}
			if (payload.username != null) {
				driver.getUser(payload.username).then(data => {
					if (data.permission >= perm) {
						return success(data);
					} else {
						return denied(data);
					}
				});
			} else {
				return failiure();
			}
		} else {
			return failiure();
		}
	} else {
		return failiure();
	}
}
function parse(data) {
	if (data != null) {
		return cookieJson.parse(data);
	}
}
function UpdatePosts(socket, alluuids = [], ismore = false) {
	Validate(
		parse(socket.request.headers.cookie),
		0,
		async usr => {
			let allposts = [];
			let allusers = await driver.getUsers();
			let useri = 0;
			let user = allusers[useri];
			let posti = user?.posts?.length ?? 0;
			while (allposts.length < 10 && useri <= allusers.length) {
				if (posti > 100 || posti == 0 || user?.posts == null) {
					useri++;
					user = allusers[useri];
					posti = user?.posts?.length ?? 0;
				} else {
					posti--;
					if (!alluuids.includes(user.posts[posti].uuid)) {

						allposts.push(user.posts[posti]);
						alluuids.push(user.posts[posti].uuid);
					}
				}
			}
			if (ismore) {
				socket.emit("feed", {
					type: "moreposts",
					data: allposts,
					uuids: alluuids,
				});
			} else {
				socket.emit("feed", {
					type: "posts",
					data: allposts,
					uuids: alluuids,
				});
			}

		},
		_ => console.log("err"),
		_ => _
	);
}
function UpdateUserlist() {
	driver.getUsers().then(allusers => {
		// get every user
		io.sockets.sockets.forEach(socket => {
			let username = ldb.get(socket.id)?.val;

			if (username != null) {
				driver
					.getUser(username)
					.then(data => {
						let userfriends = [];
						if (data.friends != null) {
							userfriends = data.friends;
						}
						let userlist = [];
						allusers.forEach(userentry => {
							if (userentry.username != username) {
								userlist.push({
									username: userentry.username,
									online: userentry.online,
									friend: userentry.friends.includes(username)
								});
							}
						});
						driver.getAllRooms().then(allrooms => {
							let roomlist = [];
							allrooms.forEach(room => {
								if (room.users.includes(data.username)) {
									delete room.messages;
									roomlist.push(room);
								}
							});
							socket.emit("userlist", {
								rooms: roomlist,
								users: userlist
							});
						});
					})
					.catch(e => {
						console.log(e);
					});
			}
		});
	});
}
function UpdateMessages(uuid, message = null) {
	driver.findRoom(uuid).then(room => {
		room.users.forEach(username => {
			driver.getUser(username).then(user => {
				pushnotif(user, message.sender, message.message);

				let socketid = ldb.rget(username)?.key;
				let socket = io.sockets.sockets.get(socketid);
				if (socket != null && message != null && room != null) {
					socket.emit("chat", message);
				}
			});
		});
	});
}
function pushnotif(user, title, body) {
	const payload = JSON.stringify({ title, body });
	if (!user.online) {
		if (!user.worker) {
			// console.log(user.username + " doesn't have a valid service worker!");
		} else {
			webpush.sendNotification(user.worker, payload).catch(error => {
				// console.error(error.stack);
			});
		}
	}
}
function UserIsOnline(socket) {
	Validate(
		parse(socket.request.headers.cookie),
		0,
		user => {
			if (!user.online) {
				user.friends.forEach(friendname => {
					driver.getUser(friendname).then(friend => {
						pushnotif(friend, `${user.username} has joined`);
					});
				});
				driver.logUser(user.username, true).then(_ => {
					UpdateUserlist();
				});
			}
		},
		_ => _,
		_ => _
	);
}
class fastmap {
	constructor() {
		this.umap = {};
		// ^ main map, key is a uuid, contains the key, the value, and any external data you want to tack on
		this.map = {};
		// ^ keys to uuids
		this.rmap = {};
		// ^ values to uuids
	}
	addItem(key, val) {
		let uuid = uuidv4();
		this.umap[uuid] = { key, val, data: {} };
		this.map[key] = uuid;
		this.rmap[val] = uuid;
	}
	set(key, val) {
		let uuid = this.map[key];
		if (this.umap[uuid] == null) {
			this.addItem(key, val);
		} else {
			this.umap[uuid].val = val;
		}
	}
	rset(value, key) {
		let uuid = this.rmap[value];
		this.umap[uuid].key = key;
	}
	setdata(key, data) {
		let uuid = this.map[key];
		this.umap[uuid].data = data;
	}
	rsetdata(val, data) {
		let uuid = this.rmap[val];
		this.umap[uuid].data = data;
	}
	get(key) {
		let uuid = this.map[key];
		return this.umap[uuid] || null;
	}
	rget(val) {
		let uuid = this.rmap[val];
		return this.umap[uuid] || null;
	}
	delete(key) {
		this.udelete(this.map[key]);
	}
	rdelete(val) {
		this.udelete(this.rmap[val]);
	}
	udelete(uuid) {
		let o = this.umap[uuid];
		if (o != null) {
			delete this.map[o.key];
			delete this.rmap[o.val];
			delete this.umap[uuid];
		} else {
			console.log("was null!");
		}
	}
}
var ldb = new fastmap();
//#endregion