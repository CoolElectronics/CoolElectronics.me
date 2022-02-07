const socket = io();

var username;
var oldlistedusers = ["null"];
var oldlistedfriends = ["null"];
var oldtabs = ["null"];

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
    Notification.requestPermission().then(function(result) {
        cansendnotifs = true;
    });
    let settingstab = $("#settings-tab");
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
        menu[0].innerHTML = "";
        storedfriendslist.forEach((friend) => {
            let button = $("<button>");
            button.text(friend.username);
            button.click(() => {
                socket.emit("chat", {
                    type: "adduser",
                    uuid: activetab.data("uuid"),
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
            uuid: activetab.data("uuid"),
            newname: prompt("new name?"),
            // lazy, but i'll fix soon:tm:
        });
        window.location.replace(window.location);
    });
    $("#roomactions-menu-leave").click((e) => {
        socket.emit("chat", {
            type: "leave",
            uuid: activetab.data("uuid")
        });
        window.location.replace(window.location);
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
                    body: res.message
                });
            }
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
            $("#userlist-friends").removeClass("m-hidden");
        } else {
            $("#userlist-friends").addClass("m-hidden");
        }
        data[0].forEach((user) => {
            appendListing(user, "#userlist-friends-container");
        });
        storedfriendslist = data[0];
    }
    if (JSON.stringify(oldlistedusers) != JSON.stringify(data[1])) {
        $("#userlist-users-container")[0].innerHTML = "";
        if (data[1].length > 0) {
            $("#userlist-users").removeClass("m-hidden");
        } else {
            $("#userlist-users").addClass("m-hidden");
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
    let menu = $("<img>");
    let roomuserlist = $("<div class = 'container-fluid m-m-container room-userlist'>");

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
    textarea.keyup(function(event) {
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
        menu.removeClass("m-hidden");
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
    if (!noclose) {
        selecteduser = null;
        let menu = $("#useractions-menu");
        menu.off();
        menu.addClass("m-hidden")
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
        console.log(tab.data("uuid") + ": " + res.roomuuid);
        if (tab.data("uuid") == res.roomuuid) {
            tab
                .children(".main-chat-container")
                .children(".main-chat-text")
                .append(
                    `<img src = "/img/${res.sender}/pfp.png" class = "pfp"> ${res.sender}: ${res.message}<br>`
                );
            tab.children(".main-chat-container").scrollTop(tab.children(".main-chat-container").height());

        }
    });
}