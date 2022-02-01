const socket = io();

var username;
var listedusers = [];

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
    socket.emit("feed", {
        type: "render"
    });
    setInterval(() => {
        socket.emit("alive")
    }, 10000);
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
    $("#userlist-users-container")[0].innerHTML = '';
    $("#userlist-friends-container")[0].innerHTML = '';
    if (data[0].length > 0) {
        $("#userlist-friends")[0].style.display = "flex";
    } else {
        $("#userlist-friends")[0].style.display = "none";
    }

    if (data[1].length > 0) {
        $("#userlist-users")[0].style.display = "flex";
    } else {
        $("#userlist-users")[0].style.display = "none";
    }
    data[0].forEach(user => {
        let userlisting = $("<div>");
        let pfp = $("<img>");
        let name = $("<p>");

        userlisting.prop("class", "userlisting");
        pfp.prop("class", "pfp");
        name.prop("class", "m-text t4 userlistname");

        name[0].innerHTML = `${user.username} is ${user.online ? "online" : "offline"}`;

        $("#userlist-friends-container").append(userlisting);
        userlisting.append(pfp)
        userlisting.append(name);

    });
    data[1].forEach(user => {
        let userlisting = $("<div>");
        let pfp = $("<img>");
        let name = $("<p>");
        userlisting.prop("class", "userlisting");
        pfp.prop("class", "pfp");
        name.prop("class", "m-text t4 userlistname");

        name[0].innerHTML = `${user.username} is ${user.online ? "online" : "offline"}`;

        $("#userlist-users-container").append(userlisting);
        userlisting.append(pfp);
        userlisting.append(name);

    });
});