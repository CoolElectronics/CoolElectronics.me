const socket = io();
var signedIn;
var authkey;
var username;
$(document).ready(() => {});

function SignedUp() {
  let usr = $("#SignUpUsername").val();
  let ps1 = $("#SignUpPassword").val();
  let ps2 = $("#SignUpConfirmPassword").val();
  username = usr;
  if (ps1 == ps2) {
    // i think this is safe?
    socket.emit("signup", { username: usr, password: ps1 });
  } else {
    alert("passwords must match! seen: " + ps1 + " - " + ps2);
  }
}

function SignedIn() {
  let usr = $("#SignInUsername").val();
  let ps1 = $("#SignInPassword").val();
  username = usr;
  socket.emit("signin", { username: usr, password: ps1 });
}

socket.on("signup", (res) => {
  switch (res) {
    case "taken":
      alert("that username is already taken");
      break;
    case "200":
      alert("Account Created");
  }
});
socket.on("signin", (res) => {
  switch (res) {
    case "nouser":
      alert("username not found");
      break;
    case "nopass":
      alert("password incorrect");
      break;
    case "200":
      signedIn = true;
  }
});
socket.on("authkey", (key) => {
  authkey = key;
  Cookies.set("username", username, { path: "/" });
  Cookies.set("authkey", authkey, { path: "/" });
});
