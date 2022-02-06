const socket = io();

var username;
var oldlistedusers = ["null"];
var oldlistedfriends = ["null"];
var oldtabs = ["null"];

var selecteduser;

var activetab = undefined;

var tabs = [];

var storedfriendslist = [];
var cansendmessage = true;
var slowmode = 1000;

socket.emit("alive");

$(document).ready(() => {
  let settingstab = $("#settings-tab");
  tabs.push(settingstab);
  let settingstabbutton = $("#settings");
  settingstabbutton.click(() => {
    SwitchTab(settingstab);
  });

  $("#add-room-button").click((e) => {
    socket.emit("chat", {
      type: "newroom",
    });
  });

  $("#sign-out").click(() => {
    socket.emit("logout");
    Cookies.remove("username", {
      path: "/",
    });
    Cookies.remove("authkey", {
      path: "/",
    });
    window.location.replace("/");
  });

  $("#useractions-menu-addfriend").click(() => {
    if (selecteduser != null) {
      socket.emit("chat", {
        type: "friend",
        username: selecteduser.username,
      });
    }
    closeUsersMenu();
  });
  $("#useractions-menu-close").click(() => {
    closeUsersMenu();
  });

  socket.emit("feed", {
    type: "render",
  });
  setInterval(() => {
    socket.emit("alive");
  }, 10000);
  $(window).click((event) => {
    if (
      event.target.id != "useractions-menu" &&
      event.target.id != "invitefriends-menu" &&
      !event.target.classList.contains("useractions-button") &&
      !event.target.classList.contains("invitefriends-button")
    ) {
      setTimeout(closeUsersMenu, 100);
    }
  });
});

socket.on("chat", (res) => {
  switch (res.type) {
    case "friend":
      if (res.result) {
        // alert("nice! friended this user!");
      } else {
        alert(res.error);
      }
      break;
    case "message":
      appendMessage(res);
      break;
    case "massmessage":
      res.messages.forEach(appendMessage);
      break;
  }
});
socket.on("feed", (res) => {
  console.log(res);
  switch (res.type) {
    case "render":
      username = res.username;
      $("#username")[0].innerHTML = username;
      $("#profile-picture").prop("src", `/img/${username}/pfp.png`);
      break;
  }
});
socket.on("userlist", (data) => {
  if (JSON.stringify(oldlistedfriends) != JSON.stringify(data[0])) {
    $("#userlist-friends-container")[0].innerHTML = "";
    if (data[0].length > 0) {
      $("#userlist-friends")[0].style.display = "flex";
    } else {
      $("#userlist-friends")[0].style.display = "none";
    }
    data[0].forEach((user) => {
      appendListing(user, "#userlist-friends-container");
    });
    storedfriendslist = data[0];
  }
  if (JSON.stringify(oldlistedusers) != JSON.stringify(data[1])) {
    $("#userlist-users-container")[0].innerHTML = "";
    if (data[1].length > 0) {
      $("#userlist-users")[0].style.display = "flex";
    } else {
      $("#userlist-users")[0].style.display = "none";
    }
    data[1].forEach((user) => {
      appendListing(user, "#userlist-users-container");
    });
  }
  if (JSON.stringify(oldtabs) != JSON.stringify(data[2])) {
    let tabuuids = tabs.map((t) => {
      return t.data("uuid");
    });

    data[2].forEach((d) => {
      if (!tabuuids.includes(d.uuid)) {
        let tab = appendTab(d);
        appendTabButton(d, tab);
      }
    });
  }
  if (activetab == undefined) {
    SwitchTab(tabs[tabs.length - 1]);
  }

  oldlistedfriends = data[0];
  oldlistedusers = data[1];
  oldtabs = data[2];
});

function appendTabButton(data, tabObj) {
  let selectorbox = $("#selectorbox");
  let tab = $("<div>");
  let text = $("<p>");

  tab.prop("class", "tab-button dyn");
  tab.data("uuid", data.uuid);
  tab.click(() => {
    SwitchTab(tabObj);
  });

  text.prop("class", "m-text");
  console.log(data.users[0]);

  if (data.name == null) {
    text.text("someone misconfigured the database /shrug");
  } else {
    text.text(data.name);
  }

  selectorbox.prepend(tab);
  tab.append(text);
}
function appendTab(data) {
  let contentbox = $("#contentbox");
  let tab = $("<div>");
  // should have used a framework :/
  let roomnamecontainer = $("<div>");
  let roomnamecontainertext = $("<p>");
  let mainchatcontainer = $("<div>");
  let mainchattext = $("<p>");
  let textareacontainer = $("<div>");
  let textarea = $("<input>");
  let invitefriendbutton = $("<button>");
  let renameroombutton = $("<button>");

  tab.prop("class", "content-tab chat-tab m-hidden");
  tab.data("uuid", data.uuid);

  roomnamecontainer.prop("class", "room-name-container chat-tab-container");
  roomnamecontainertext.prop("class", "m-text t2");

  mainchatcontainer.prop("class", "main-chat-container chat-tab-container");
  mainchattext.prop("class", "m-text t4 main-chat-text");

  textareacontainer.prop("class", "textarea-container chat-tab-container");
  textarea.prop("class", "chat-tab-textarea m-text");

  roomnamecontainertext.text(data.name);

  contentbox.append(tab);
  tab.append(roomnamecontainer);
  tab.append(mainchatcontainer);
  tab.append(textareacontainer);

  roomnamecontainer.append(roomnamecontainertext);
  roomnamecontainer.append(invitefriendbutton);
  roomnamecontainer.append(renameroombutton);

  mainchatcontainer.append(mainchattext);
  textareacontainer.append(textarea);

  invitefriendbutton.text("Invite Friends");
  invitefriendbutton.prop("class", "invitefriends-button");
  textarea.keyup(function (event) {
    if (event.keyCode === 13) {
      if (cansendmessage) {
        socket.emit("chat", {
          type: "send",
          uuid: data.uuid,
          message: textarea.val(),
        });
        textarea.val("");
        cansendmessage = false;
        setTimeout(() => (cansendmessage = true), slowmode);
      }
    }
  });
  invitefriendbutton.click((e) => {
    let menu = $("#invitefriends-menu");
    menu.prop("style", "display:flex");
    menu[0].style.left = e.clientX - 50 + "px";
    menu[0].style.top = window.innerHeight / 2 + "px";
    menu[0].innerHTML = "";
    storedfriendslist.forEach((friend) => {
      let button = $("<button>");
      button.text(friend.username);
      button.click(() => {
        socket.emit("chat", {
          type: "adduser",
          uuid: data.uuid,
          username: friend.username,
        });
        closeUsersMenu();
      });
      menu.append(button);
    });
  });

  renameroombutton.text("rename room");
  renameroombutton.click(() => {
    socket.emit("chat", {
      type: "rename",
      uuid: data.uuid,
      newname: prompt("new name?"),
      // lazy, but i'll fix soon:tm:
    });
  });
  // all done

  tabs.push(tab);
  socket.emit("chat", {
    type: "roomrequest",
    uuid: data.uuid,
  });
  return tab;
}
function SwitchTab(tab) {
  tabs.forEach((t) => {
    t.addClass("m-hidden");
  });

  tab.removeClass("m-hidden");
  tab.removeClass("m-hidden");
  activetab = tab;
}
function appendListing(user, parent) {
  let userlisting = $("<div>");
  let pfp = $("<img>");
  let name = $("<p>");
  let actions = $("<img>");

  userlisting.prop("class", "userlisting");
  pfp.prop("class", "pfp");
  pfp.prop("src", `/img/${user.username}/pfp.png`);

  name.prop("class", "m-text t4 userlistname");

  name[0].innerHTML = `${user.username} is ${
    user.online ? "online" : "offline"
  }`;

  actions.prop("class", "useractions-button");
  actions.prop("src", "/img/show-more.png");
  actions.click((event) => {
    let menu = $("#useractions-menu");
    menu.prop("style", "display:flex");
    menu[0].style.left = event.clientX - 50 + "px";
    menu[0].style.top = event.clientY - 50 + "px";
    selecteduser = user;
  });

  $(parent).append(userlisting);
  userlisting.append(pfp);
  userlisting.append(name);
  userlisting.append(actions);
}

function closeUsersMenu() {
  selecteduser = null;
  let menu = $("#useractions-menu");
  menu.off();
  menu.prop("style", "display:none");
  menu = $("#invitefriends-menu");
  menu.off();
  menu.prop("style", "display:none");
}
function appendMessage(res) {
  tabs.forEach((tab) => {
    console.log(tab.data("uuid") + ": " + res.roomuuid);
    if (tab.data("uuid") == res.roomuuid) {
      tab
        .children(".main-chat-container")
        .children(".main-chat-text")
        .append(
          `<br><img src = "/img/${res.sender}/pfp.png" class = "pfp"> ${res.sender}: ${res.message}`
        );
    }
  });
}
