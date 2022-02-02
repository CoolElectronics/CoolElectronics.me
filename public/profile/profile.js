const socket = io();

var username;
var oldlistedusers = ["null"];
var oldlistedfriends = ["null"];


socket.emit("alive");

$(document).ready(() => {
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

    $("useractions-menu-addfriend").click(() => {

        closeUsersMenu();
    });
    $("useractions-menu-close").click(() => {
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
            closeUsersMenu();
        }
    });
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

    oldlistedfriends = data[0];
    oldlistedusers = data[1];
});

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

    });

    $(parent).append(userlisting);
    userlisting.append(pfp)
    userlisting.append(name);
    userlisting.append(actions);
}

function closeUsersMenu() {
    let menu = $("#useractions-menu");
    menu.off();
    menu.prop("style", "display:none");
}