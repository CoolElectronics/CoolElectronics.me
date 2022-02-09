const socket = io();

var username;

var selecteduser;

var activetab = undefined;

var tabs = [];
var cansendnotifications = false;
var storedfriendslist = [];
var cansendmessage = true;
var slowmode = 1000;
var noclose = false;

socket.emit("alive");

$(document).ready(() => {
  let settingstab = new SettingsTab();
  tabs.push(settingstab);
  let settingstabbutton = $("#settings");
  settingstabbutton.click(() => {
    SwitchTab(settingstab);
  });
  $("#roomactions-menu-invite").click((e) => {
    noclose = true;
    let menu = $("#invitefriends-menu");
    menu.removeClass("m-hidden");
    menu[0].style.left = window.innerWidth / 2 + "px";
    menu[0].style.top = window.innerHeight / 2 + "px";
    menu.text("");
    storedfriendslist.forEach((friend) => {
      let button = $("<button>");
      button.text(friend.username);
      button.click(() => {
        socket.emit("chat", {
          type: "adduser",
          uuid: activetab.uuid,
          username: friend.username,
        });
        closeUsersMenu();
      });
      menu.append(button);
    });
    closeUsersMenu();
  });

  $("#roomactions-menu-rename").click(() => {
    socket.emit("chat", {
      type: "rename",
      uuid: activetab.uuid,
      newname: prompt("new name?"),
    });
    closeUsersMenu();
    // window.location.replace(window.location); do NOT do this
  });
  $("#roomactions-menu-leave").click((e) => {
    socket.emit("chat", {
      type: "leave",
      uuid: activetab.uuid,
    });
    closeUsersMenu();
    // window.location.replace(window.location);
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
    Notification.requestPermission().then((result) => {
      cansendnotifs = true;
    });
    if (
      event.target.id != "useractions-menu" &&
      event.target.id != "invitefriends-menu" &&
      !event.target.classList.contains("useractions-button") &&
      !event.target.classList.contains("floating-menu-button")
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
      if (!document.hasFocus()) {
        new Notification(res.sender, {
          body: res.message,
        });
      }
      break;
    case "massmessage":
      res.messages.forEach(appendMessage);
      break;
  }
});
socket.on("feed", (res) => {
  switch (res.type) {
    case "render":
      username = res.username;
      $("#username").text(username);
      $("#profile-picture").prop("src", `/img/${username}/pfp.png`);
      break;
  }
});
socket.on("userlist", (data) => {
  let tabuuids = tabs.map((t) => {
    return t.uuid;
  });
  let datuuids = data.rooms.map((d) => {
    return d.uuid;
  });
  tabs.forEach((t) => {
    if (!(t instanceof SettingsTab)) {
      if (!datuuids.includes(t.uuid)) {
        t.delete();
      }
    }
  });
  data.rooms.forEach((d) => {
    tabs.forEach((t) => {
      if (t.uuid == d.uuid) {
        t.update(d);
      }
    });
    if (!tabuuids.includes(d.uuid)) {
      tabs.push(new Tab(d));
    }
  });
  if (activetab == undefined) {
    SwitchTab(tabs[tabs.length - 1]);
  }
  data.users.forEach((u) => {
    if (u.friend) {
      if (
        !storedfriendslist
          .map((s) => {
            return s.username;
          })
          .includes(u.username)
      ) {
        storedfriendslist.push(u);
      }
    }
  });
  tabs.forEach((t) => {
    t.updateUsers(data.users);
  });
});

function SwitchTab(tab) {
  tabs.forEach((t) => {
    t.tab.addClass("m-hidden");
  });
  console.log(tab);

  tab.tab.removeClass("m-hidden");
  activetab = tab;
}
function closeUsersMenu() {
  if (!noclose) {
    selecteduser = null;
    let menu = $("#useractions-menu");
    menu.off();
    menu.addClass("m-hidden");
    menu = $("#invitefriends-menu");
    menu.off();
    menu.addClass("m-hidden");
    menu = $("#roomactions-menu");
    menu.off();
    menu.addClass("m-hidden");
  } else {
    noclose = false;
  }
}

function appendMessage(res) {
  tabs.forEach((tab) => {
    if (tab.uuid == res.roomuuid) {
      tab.addMessage(res.sender, res.message);
    }
  });
}

class Tab {
  constructor(roomdata) {
    this.uuid = roomdata.uuid;
    this.name = roomdata.name;
    this.usernames = roomdata.users;

    console.log(this.uuid);

    this.oldpacket = null;

    this.tab = this.appendTab();
    this.tabButton = this.appendTabButton();
    this.users = [];
  }
  update(packet) {
    if (packet != this.oldpacket) {
      if (this.name != packet.name) {
        this.tab.children(".room-name-container").children().text(packet.name);
        this.tabButton.children("p").text(packet.name);
      }
      this.usernames = packet.users;
    }
    this.oldpacket = packet;
  }
  updateUsers(newusers) {
    console.log("updating users");
    // newusers being the complete list of {username,online}
    // releventusers being the {username,online pairs inside this room}
    // users being a list of User classes
    let relevantUsers = newusers.filter((u) => {
      return this.usernames.includes(u.username);
    });
    let usernamesmap = this.users.map((u) => {
      return u.username;
    });
    let relevantusernamesmap = relevantUsers.map((u) => {
      return u.username;
    });
    this.users.forEach((u) => {
      if (!relevantusernamesmap.includes(u.username)) {
        this.users = this.users.filter((u2) => {
          return u2 != u;
        });
        u.delete();
      }
      relevantUsers.forEach((ru) => {
        if (ru.username == u.username) {
          if (ru.online != u.online) {
            u.update(ru.online);
          }
        }
      });
    });
    relevantUsers.forEach((u) => {
      if (!usernamesmap.includes(u.username)) {
        this.users.push(
          new User(
            u.username,
            u.online,
            this,
            this.tab.children(".room-userlist")
          )
        );
      }
    });
  }
  addMessage(sender, message) {
    this.tab
      .children(".main-chat-container")
      .children(".main-chat-text")
      .append(
        `<img src = "/img/${sender}/pfp.png" class = "pfp"> ${sender}: ${message}<br>`
      );
    this.tab.children(".main-chat-container").scrollTop(9999999999); //super dumb but whatever
    console.error("FIX THIS");
  }
  appendTabButton() {
    let selectorbox = $("#selectorbox");
    let tab = $("<div>");
    let text = $("<p>");

    tab.addClass("tab-button dyn");
    tab.click(() => {
      SwitchTab(this);
    });

    text.addClass("m-text");

    text.text(this.name);

    selectorbox.prepend(tab);
    tab.append(text);

    return tab;
  }
  appendTab() {
    let contentbox = $("#contentbox");
    let tab = $("<div>");
    // should have used a framework :/
    let roomnamecontainer = $("<div>");
    let roomnamecontainertext = $("<p>");
    let mainchatcontainer = $("<div>");
    let mainchattext = $("<p>");
    let textareacontainer = $("<div>");
    let textarea = $("<input>");
    let menu = $("<img>");
    let roomuserlist = $(
      "<div class = 'container-fluid m-m-container room-userlist'>"
    );

    tab.prop("class", "content-tab chat-tab m-hidden");

    roomnamecontainer.prop("class", "room-name-container chat-tab-container");
    roomnamecontainertext.prop("class", "m-text t2");

    mainchatcontainer.prop("class", "main-chat-container chat-tab-container");
    mainchattext.prop("class", "m-text t4 main-chat-text");

    textareacontainer.prop("class", "textarea-container chat-tab-container");
    textarea.prop("class", "chat-tab-textarea m-text");

    roomnamecontainertext.text(this.name);

    contentbox.append(tab);
    tab.append(roomnamecontainer);
    tab.append(mainchatcontainer);
    tab.append(textareacontainer);
    tab.append(roomuserlist);

    roomnamecontainer.append(roomnamecontainertext);

    roomnamecontainer.append(menu);

    mainchatcontainer.append(mainchattext);
    textareacontainer.append(textarea);

    menu.prop("src", "/img/show-more.png");
    menu.addClass("useractions-button");
    menu.click((event) => {
      let menu = $("#roomactions-menu");
      menu.removeClass("m-hidden");
      menu[0].style.left = event.clientX - 50 + "px";
      menu[0].style.top = event.clientY - 50 + "px";
    });
    textarea.keyup((event) => {
      if (event.keyCode === 13) {
        if (cansendmessage) {
          console.log(this.uuid);
          socket.emit("chat", {
            type: "send",
            uuid: this.uuid,
            message: textarea.val(),
          });
          textarea.val("");
          cansendmessage = false;
          setTimeout(() => (cansendmessage = true), slowmode);
        }
      }
    });
    socket.emit("chat", {
      type: "roomrequest",
      uuid: this.uuid,
    });
    return tab;
  }
  delete() {
    tabs = tabs.filter((t) => {
      return t != this;
    });
    this.tab.remove();
    this.tabButton.remove();
  }
}
class User {
  constructor(name, online, parent, dom) {
    this.parent = parent;
    this.username = name;
    this.online = online;
    this.listing = this.addListing(dom);
  }
  delete() {
    this.listing.remove();
  }
  update(online) {
    this.online = online;
    this.listing
      .children("p")
      .text(`${this.username} is ${this.online ? "online" : "offline"}`);
  }
  addListing(parent) {
    let userlisting = $("<div>");
    let pfp = $("<img>");
    let name = $("<p>");
    let actions = $("<img>");

    userlisting.addClass("userlisting");
    pfp.prop("class", "pfp");
    pfp.prop("src", `/img/${this.username}/pfp.png`);

    name.prop("class", "m-text t4 userlistname");

    name.text(`${this.username} is ${this.online ? "online" : "offline"}`);

    actions.prop("class", "useractions-button");
    actions.prop("src", "/img/show-more.png");
    actions.click((event) => {
      let menu = $("#useractions-menu");
      menu.removeClass("m-hidden");
      menu[0].style.left = event.clientX - 50 + "px";
      menu[0].style.top = event.clientY - 50 + "px";
      selecteduser = this;
    });

    $(parent).append(userlisting);
    userlisting.append(pfp);
    userlisting.append(name);
    userlisting.append(actions);
    return userlisting;
  }
}
class SettingsTab {
  constructor() {
    this.tab = $("#settings-tab");
  }
  updateUsers() {}
}
