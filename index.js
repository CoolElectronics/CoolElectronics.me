// MAIN SCRIPT

const port = 8080;
const saltRounds = 10;

let validKeys = [];

const express = require("express");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const mysql = require("mysql");
const fs = require("fs");
const http = require("http");
const https = require("https");
const bcrypt = require("bcrypt");
const { Server } = require("socket.io");
const { uuid } = require("uuidv4");

const gamedriver = require("./gamedriver.js");
const userdriver = require("./userdriver.js");

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

app.get("/", function (req, res) {
  var cookies = req.cookies;
  if (cookies.username != null) {
    var ckey;
    validKeys.forEach((key) => {
      if (key.username == cookies.username) {
        ckey = key;
      }
    });
    if (ckey != null) {
      //this won't scale well. good thing i don't need to worry about that
      bcrypt.compare(ckey.key, cookies.authkey, (err, bres) => {
        if (bres) {
          console.log("user has valid key!");
          res.redirect("/profile");
        } else {
          console.log("user has invalid key!");
          res.redirect("/sign");
        }
      });
    } else {
      console.log("user has outdated key!");
      res.redirect("/sign");
    }
  } else {
    res.render("pages/index");
  }
});

app.get("/profile", (req, res) => {
  var cookies = req.cookies;
  if (cookies.username != null) {
    var ckey;
    validKeys.forEach((key) => {
      if (key.username == cookies.username) {
        ckey = key;
      }
    });
    if (ckey != null) {
      bcrypt.compare(ckey.key, cookies.authkey, (err, bres) => {
        if (bres) {
          console.log("user has valid key!");
          res.render("pages/profile");
        } else {
          console.log("user has invalid key!");
          res.redirect("/sign");
        }
      });
    } else {
      console.log("user has outdated key!");
      res.redirect("/sign");
    }
  } else {
    res.redirect("/sign");
  }
});
app.get("/admin", (req, res) => {
  var cookies = req.cookies;
  if (cookies.username != null) {
    var ckey;
    validKeys.forEach((key) => {
      if (key.username == cookies.username) {
        ckey = key;
      }
    });
    if (ckey != null) {
      bcrypt.compare(ckey.key, cookies.authkey, (err, bres) => {
        if (bres) {
          userdriver
            .getUser(ckey.username)
            .then((dres) => {
              let user = dres[0];
              if (user.permission >= 3) {
                res.render("pages/admin");
              } else {
                res.redirect("/");
              }
            })
            .catch((e) => console.log(e));
        } else {
          console.log("user has invalid key!");
          res.redirect("/sign");
        }
      });
    } else {
      console.log("user has outdated key!");
      res.redirect("/sign");
    }
  } else {
    res.redirect("/sign");
  }
});

app.get("/sign", function (req, res) {
  res.render("pages/sign");
});
app.get("/games", function (req, res) {
  res.render("pages/games");
});
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("signup", (msg) => {
    var username = msg.username;
    bcrypt.hash(msg.password, saltRounds, function (err, hash) {
      StorePass(username, hash, socket);
    });
  });
  socket.on("signin", (msg) => {
    var username = msg.username;
    CheckPass(username)
      .then((v) => {
        let usr = v[0];
        if (usr) {
          bcrypt.compare(msg.password, usr.hash, function (err, res) {
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
});

httpServer.listen(port, () => {
  console.log("HTTP Server running on port 80");
});
// httpsServer.listen(443, () => {
//   console.log("HTTPS Server running on port 443");
// });

function StorePass(user, hash, socket) {
  userdriver.getUser(user).then((v) => {
    if (v.length > 0) {
      socket.emit("signup", "taken");
    } else {
      userdriver.addUser(user, hash);
      socket.emit("signup", "200");
      MakeAuth(user, socket);
    }
  });
}
function MakeAuth(user, socket) {
  let kpass = uuid();
  bcrypt.hash(kpass, saltRounds, function (err, hash) {
    var key = hash;
    validKeys.push({
      key: kpass,
      username: user,
    });
    socket.emit("authkey", key);
  });
}
function CheckPass(user) {
  return userdriver.getUser(user);
}
