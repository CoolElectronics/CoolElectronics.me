const port = 8080;
const saltRounds = 10;

//requires
const jwt = require("jsonwebtoken");
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
//middlewaring
const res = require("express/lib/response");
const app = express();

const httpServer = http.createServer(app);
const io = new Server(httpServer);


app.use(compression());
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");


//endpoints
app.get("/", function (req, res) {
  Validate(
    req.cookies,
    0,
    _ => res.redirect("/profile"),
    _ => res.render("pages/index"),
    _ => res.render("pages/index")
  );
});

app.get("/profile", (req, res) => {
  Validate(
    req.cookies,
    0,
    () => res.render("pages/profile"),
    () => res.redirect("/sign"),
    () => res.redirect("/")
  );
});
app.get("/admin", (req, res) => {
  Validate(
    req.cookies,
    3,
    () => res.render("pages/admin"),
    () => res.redirect("/sign"),
    () => res.redirect("/")
  );
});

app.get("/sign", function (req, res) {
  res.render("pages/sign");
});
app.get("/games", function (req, res) {
  res.render("pages/games");
});

io.on("connection", (socket) => {
  socket.on("disconnect", () => {

  });
  socket.on("alive", () => {
  });
  socket.on("feed", () => {

  });
  socket.on("games", () => {

  });
  socket.on("chat", (req) => {
  });
  socket.on("sign", (req) => {
    switch (req.type) {
      case "in":
        var username = req.username;
        driver.getUser(username)
          .then((usr) => {
            if (usr) {
              bcrypt.compare(req.password, usr.hash, function (err, res) {
                if (res) {
                  console.log(username + " logged in");
                  socket.emit("sign", { type: "in", res: 200 });
                  Auth(usr, socket);
                } else {
                  socket.emit("sign", { type: "in", res: "nopass" });
                }
              });
            } else {
              socket.emit("sign", { type: "in", res: "nouser" });
            }
          })
          .catch((e) => {
            console.log(e);
          });
        break;
      case "up":
        console.log("???");
        var username = xss(req.username);
        bcrypt.hash(req.password, saltRounds, (err, hash) => {
          driver.getUser(username).then((v) => {
            console.log(v);
            if (v != null) {
              socket.emit("sign", { type: "up", res: "taken" });
            } else {
              console.log("account made");
              driver.addUser(v.username, hash);
              socket.emit("sign", { type: "up", res: 200 });
              Auth(v.username, socket);
            }
          });
        });
        break;
      case "out":
        socket.emit("sign", { type: "out" });
        break;
      default:
        console.log("fix your packets >:(");
    }
  });
  socket.on("admin", (req) => {
    Validate(socket.request.headers.cookie, 3, user => {
      switch (req.type) {
        case "crd":
          axios.get(process.env.HOST_IP + "/api/crd");
          break;
        default:
          console.log("fix your packets >:(");
      }
    }, _ => _, _ => socket.emit("admin", { res: "denied" }))
  });
});






httpServer.listen(port, () => {
  console.log(`HTTP Server running on port ${port}`);
});


// utilities
function Auth(user, socket) {
  let token = jwt.sign({ username: user.username }, process.env.JWT, {
    algorithm: "HS256"
  })
  socket.emit("sign", { type: "auth", token });
}
function Validate(cookies, perm, success, failiure, denied) {
  var payload;
  if (cookies != null) {
    if (cookies.token != null) {
      try {
        payload = jwt.verify(cookies.token, process.env.JWT,{
          algorithm: "HS256"
        });
      } catch (e) {
        return failiure();
      }
      if (payload.username != null) {
        driver.getUser(payload.username).then((data) => {
          if (data.permission >= perm) {
            return success(data);
          } else {
            return denied(data);
          }
        });
      }else{
        return failiure();
      }
    }else{
      return failiure();
    }
  }else{
    return failiure();
  }
}
function parse(data) {
  if (data != null) {
    return cookieJson.parse(data);
  }
}