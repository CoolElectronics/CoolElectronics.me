const socket = io();

var username;
var oldlistedusers = ["null"];
var oldlistedfriends = ["null"];
var oldtabs = ["null"];

var selecteduser;

var activetab = undefined;

var tabs = [];

socket.emit("alive");

$(document).ready(() => {
    tabs.push($("#settings-tab"))

    $("#add-room-button").click(e => {
        socket.emit("chat", {
            type: "newroom"
        });
    });

    $("#sign-out").click(() => {
        socket.emit("logout");
        Cookies.remove("username", {
            path: "/"
        });
        Cookies.remove("authkey", {
            path: "/"
        });
        window.location.replace("/");
    });

    $("#useractions-menu-addfriend").click(() => {
        if (selecteduser != null) {
            socket.emit("chat", {
                type: "friend",
                username: selecteduser.username
            });
        }
        closeUsersMenu();
    });
    $("#useractions-menu-close").click(() => {
        closeUsersMenu();
    });


    socket.emit("feed", {
        type: "render"
    });
    setInterval(() => {
        socket.emit("alive")
    }, 10000);
    $(window).click((event) => {
        if (event.target.id != "useractions-menu" && !event.target.classList.contains("useractions-button")) {
            setTimeout(closeUsersMenu, 100);
        }
    });
});

socket.on("chat", res => {
    switch (res.type) {
        case "friend":
            if (res.result) {
                alert("nice! friended this user!");
            } else {
                alert(res.error);
            }
            break;
    }
});

socket.on("feed", (res) => {
    console.log(res);
    switch (res.type) {
        case "render":
            username = res.username;
            $("#username")[0].innerHTML = username;
            break;
    }
});
socket.on("userlist", (data) => {

    if (JSON.stringify(oldlistedfriends) != JSON.stringify(data[0])) {
        $("#userlist-friends-container")[0].innerHTML = '';
        if (data[0].length > 0) {
            $("#userlist-friends")[0].style.display = "flex";
        } else {
            $("#userlist-friends")[0].style.display = "none";
        }
        data[0].forEach(user => {
            appendListing(user, "#userlist-friends-container");
        });
    }
    if (JSON.stringify(oldlistedusers) != JSON.stringify(data[1])) {
        $("#userlist-users-container")[0].innerHTML = '';
        if (data[1].length > 0) {
            $("#userlist-users")[0].style.display = "flex";
        } else {
            $("#userlist-users")[0].style.display = "none";
        }
        data[1].forEach(user => {
            appendListing(user, "#userlist-users-container");
        });

    }
    if (JSON.stringify(oldtabs) != JSON.stringify(data[2])) {

        $("div").remove(".dyn");
        data[2].forEach((d) => {
            appendTab(d);
        });
    }

    if (activetab == undefined) {
        activetab = tabs[0];
    }

    oldlistedfriends = data[0];
    oldlistedusers = data[1];
    oldtabs = data[2];
});

function appendTab(data) {
    let selectorbox = $("#selectorbox");
    let tab = $("<div>");
    let text = $("<p>");

    tab.prop("class", "tab-button dyn");
    text.prop("class", "m-text");
    console.log(data.users[0]);
    text.text(data.users[0]);

    selectorbox.prepend(tab);
    tab.append(text);
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

    name[0].innerHTML = `${user.username} is ${user.online ? "online" : "offline"}`;

    actions.prop("class", "useractions-button");
    actions.prop("src", "/img/show-more.png");
    actions.click((event) => {
        let menu = $("#useractions-menu");
        menu.prop("style", "display:flex");
        console.log(event.clientX);
        menu[0].style.left = event.clientX - 50 + "px";
        menu[0].style.top = event.clientY - 50 + "px";
        selecteduser = user;
    });

    $(parent).append(userlisting);
    userlisting.append(pfp)
    userlisting.append(name);
    userlisting.append(actions);
}

function closeUsersMenu() {
    selecteduser = null;
    let menu = $("#useractions-menu");
    menu.off();
    menu.prop("style", "display:none");
}