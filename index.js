// MAIN SCRIPT

const port = 8080;
const saltRounds = 10;

let validKeys = [];

const express = require("express");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const fs = require("fs");
const http = require("http");
const https = require("https");
const cookieJson = require("cookie");
const bcrypt = require("bcrypt");
const {
    Server
} = require("socket.io");
const {
    uuid
} = require("uuidv4");
const xss = require("xss");
const axios = require("axios");
const denv = require("dotenv").config();

const driver = require("./driver.js");
const {
    logUser
} = require("./driver.js");
const res = require("express/lib/response");

const app = express();
const httpServer = http.createServer(app);
// const httpsServer = https.createServer(
//   {
//     key: fs.readFileSync("key.pem"),
//     cert: fs.readFileSync("cert.pem"),
//   },
//   app
// );
const io = new Server(httpServer);
app.use(compression());
app.use(cookieParser());

app.use(express.static(__dirname + "/public"));

app.set("view engine", "ejs");

app.get("/", function(req, res) {
    CheckAuth(
        req.cookies,
        0,
        () => res.redirect("/profile"),
        () => res.render("pages/index"),
        () => res.render("pages/index")
    );
});

app.get("/profile", (req, res) => {
    CheckAuth(
        req.cookies,
        0,
        () => res.render("pages/profile"),
        () => res.redirect("/sign"),
        () => res.redirect("/")
    );
});
app.get("/admin", (req, res) => {
    CheckAuth(
        req.cookies,
        3,
        () => res.render("pages/admin"),
        () => res.redirect("/sign"),
        () => res.redirect("/")
    );
});

app.get("/sign", function(req, res) {
    res.render("pages/sign");
});
app.get("/games", function(req, res) {
    res.render("pages/games");
});
app.get("/dev/valid", function(req, res) {
    console.log(validKeys);
});
io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on("disconnect", () => {
        console.log("a user disconnected");
        let cookies = safeparse(socket.request.headers.cookie);
        if (cookies != null) {
            driver.logUser(cookies.username, false);
        }
        UpdateUserlist();
    });
    socket.on("alive", (req) => {
        let cookies = safeparse(socket.request.headers.cookie);
        if (cookies != null) {
            driver.logUser(cookies.username, true);
        }
        UpdateUserlist();
    });

    socket.on("feed", (req) => {
        switch (req.type) {
            case "render":
                let cookies = socket.request.headers.cookie;
                CheckAuth(
                    safeparse(cookies),
                    0,
                    (usr) => {
                        socket.emit("feed", {
                            type: "render",
                            username: usr.username,
                        });
                    },
                    () => {
                        console.log("err");
                    },
                    () => {}
                );
                break;
        }
    });

    socket.on("chat", (req) => {
        let cookies = socket.request.headers.cookie;
        CheckAuth(
            safeparse(cookies),
            0,
            (usr) => {
                switch (req.type) {
                    case "friend":
                        if (usr.username != req.username) {
                            // user is the user data of the function caller
                            driver
                                .getUser(req.username)
                                .then((target) => {
                                    // target is the target
                                    if (target != null) {
                                        if (!usr.friends.includes(target.username)) {
                                            let friends = usr.friends;
                                            friends.push(target.username);
                                            driver.updateUser(
                                                usr.username,
                                                usr.username,
                                                usr.permission,
                                                friends
                                            );
                                            friends = target.friends;
                                            friends.push(usr.username);
                                            driver.updateUser(
                                                target.username,
                                                target.username,
                                                target.permission,
                                                friends
                                            );
                                            socket.emit("chat", {
                                                type: "friend",
                                                result: true,
                                            });
                                            UpdateUserlist();
                                        } else {
                                            driver.updateUser(
                                                usr.username,
                                                usr.username,
                                                usr.permission,
                                                usr.friends.filter((v) => {
                                                    return v != target.username;
                                                })
                                            );
                                            driver.updateUser(
                                                target.username,
                                                target.username,
                                                target.permission,
                                                target.friends.filter((v) => {
                                                    return v != usr.username;
                                                })
                                            );
                                            socket.emit("chat", {
                                                type: "friend",
                                                result: false,
                                                error: "unfriended user.",
                                            });
                                            UpdateUserlist();
                                        }
                                    } else {
                                        socket.emit("chat", {
                                            type: "friend",
                                            result: false,
                                            error: "That user does not exist!",
                                        });
                                    }
                                })
                                .catch((e) => console.log(e));
                        } else {
                            socket.emit("chat", {
                                type: "friend",
                                result: false,
                                error: "Sorry, you can't be friends with yourself :(",
                            });
                        }

                        break;
                    case "newroom":
                        let roomuuid = uuid();
                        driver.makeRoom(roomuuid, usr.username).then(() => {
                            UpdateUserlist();
                        });
                        break;
                    case "adduser":
                        driver.addUserToRoom(req.uuid, req.username);
                        UpdateUserlist();
                        break;
                    case "rename":
                        // didn't do any checks to see if the user owns the room, don't care
                        driver.renameRoom(req.uuid, xss(req.newname));
                        UpdateUserlist();
                        break;
                    case "send":
                        let sanitizedmessage = xss(req.message);
                        if (sanitizedmessage != "") {
                            let messageobj = {
                                type: "message",
                                sender: usr.username,
                                message: sanitizedmessage,
                                messageuuid: uuid(), // are you happy now?
                                roomuuid: req.uuid,
                            };
                            UpdateMessages(req.uuid, messageobj);
                            driver.addMessageToRoom(req.uuid, messageobj);
                        }
                        break;
                    case "roomrequest":
                        driver.findRoom(req.uuid).then((room) => {
                            socket.emit("chat", {
                                type: "massmessage",
                                messages: room.messages,
                            });
                        });
                        break;
                    case "leave":
                        driver.removeUserFromRoom(req.uuid, usr.username);
                        break;
                    default:
                        console.log("could not parse type " + res.type);
                }
            },
            () => {
                socket.emit("chat", {
                    type: req.type,
                    result: false,
                    error: "You are not a valid user?",
                });
            },
            () => {}
        );
    });

    socket.on("signup", (msg) => {
        var username = xss(msg.username);
        if (username == msg.username) {
            bcrypt.hash(msg.password, saltRounds, function(err, hash) {
                StorePass(username, hash, socket);
            });
        } else {
            socket.emit("signup", "taken");
        }
    });
    socket.on("signin", (msg) => {
        var username = msg.username;
        CheckPass(username)
            .then((v) => {
                let usr = v;
                if (usr) {
                    bcrypt.compare(msg.password, usr.hash, function(err, res) {
                        if (res) {
                            console.log(username + " logged in");
                            socket.emit("signin", "200");
                            MakeAuth(username, socket);
                        } else {
                            socket.emit("signin", "nopass");
                        }
                    });
                } else {
                    socket.emit("signin", "nouser");
                }
            })
            .catch((e) => {
                console.log(e);
            });
    });
    socket.on("logout", () => {
        let cookies = safeparse(socket.request.headers.cookie);
        let key = FindKey(cookies);
        if (key != null) {
            logUser(key.username, false);
            validKeys = validKeys.filter((e) => {
                return e != key;
            });
            UpdateUserlist();
        }
    });
    socket.on("admin", (req) => {
        CheckAuth(
            safeparse(socket.request.headers.cookie),
            3,
            () => {
                switch (req.type) {
                    case "crd":
                        // console.log(process.env.HOST_IP);
                        axios.get(process.env.HOST_IP + "/api/crd");
                        break;
                }
            },
            () => {},
            () => {}
        );
    });
});

httpServer.listen(port, () => {
    console.log("HTTP Server running on port 80");
});
// httpsServer.listen(443, () => {
//   console.log("HTTPS Server running on port 443");
// });

function StorePass(user, hash, socket) {
    driver.getUser(user).then((v) => {
        if (v != null) {
            socket.emit("signup", "taken");
        } else {
            driver.addUser(user, hash);
            socket.emit("signup", "200");
            MakeAuth(user, socket);
        }
    });
}

function MakeAuth(user, socket) {
    validKeys = validKeys.filter((e) => {
        return e.username != user;
    });

    let kpass = uuid();
    bcrypt.hash(kpass, saltRounds, function(err, hash) {
        var key = hash;
        validKeys.push({
            key: kpass,
            username: user,
        });
        driver.logUser(user, true);
        socket.emit("authkey", key);
    });
}

function CheckPass(user) {
    return driver.getUser(user);
}

function FindKey(cookies) {
    if (cookies != null) {
        if (cookies.username != null) {
            var ckey;
            validKeys.forEach((key) => {
                if (key.username == cookies.username) {
                    ckey = key;
                }
            });
            if (ckey != null) {
                return ckey;
            }
        }
    }
    return null;
}

function CheckAuth(cookies, reqperm, success, failiure, denied) {
    let ckey = FindKey(cookies);
    if (ckey != null) {
        bcrypt.compare(ckey.key, cookies.authkey, (err, bres) => {
            if (bres) {
                driver
                    .getUser(ckey.username)
                    .then((dres) => {
                        let user = dres;
                        if (user.permission >= reqperm) {
                            success(user);
                        } else {
                            denied();
                        }
                    })
                    .catch((e) => console.log(e));
            } else {
                failiure();
            }
        });
    } else {
        // console.log("user has outdated key!");
        failiure();
    }
}

function UpdateUserlist() {
    driver.getUsers().then((allusers) => {
        // get every user
        io.sockets.sockets.forEach((socket) => {
            let cookies = safeparse(socket.request.headers.cookie);
            let myKey = FindKey(cookies);
            if (myKey != null) {
                driver
                    .getUser(myKey.username)
                    .then((data) => {
                        let userfriends = [];
                        if (data.friends != null) {
                            userfriends = data.friends;
                        }
                        let friendlist = [];
                        let userlist = [];
                        allusers.forEach((userentry) => {
                            if (userentry.username != myKey.username) {
                                if (userentry.friends.includes(myKey.username)) {
                                    friendlist.push({
                                        username: userentry.username,
                                        online: userentry.online,
                                    });
                                } else {
                                    userlist.push({
                                        username: userentry.username,
                                        online: userentry.online,
                                    });
                                }
                            }
                        });
                        driver.getAllRooms().then((allrooms) => {
                            let roomlist = [];
                            allrooms.forEach((room) => {
                                room.dynUsers = friendlist.some(u => {
                                    return room.users.includes(u.username)
                                });
                                room.dynUsers.concat(userlist.some(u => {
                                    return room.users.includes(u.username)
                                }));
                                if (room.users.includes(data.username)) {
                                    roomlist.push(room);
                                }
                            });
                            socket.emit("userlist", [friendlist, userlist, roomlist]);
                        });
                    })
                    .catch((e) => {
                        console.log(e);
                    });
            }
        });
    });
}

function UpdateMessages(uuid, message = null) {
    driver.findRoom(uuid).then((room) => {
        io.sockets.sockets.forEach((s) => {
            let key = FindKey(safeparse(s.request.headers.cookie));
            if (key != null) {
                if (room.users.includes(key.username)) {
                    if (message != null) {
                        s.emit("chat", message);
                    }
                }
            }
        });
    });
}

function KeyFromUser(username) {
    validKeys.forEach((key) => {
        if (key.username == username) {
            return key;
        }
    });
}

function safeparse(cookies) {
    if (cookies != null) {
        return cookieJson.parse(cookies);
    }
}