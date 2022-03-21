var socket = io();
var ContextMenu = contextMenu();
var App = app();

function contextMenu() {
    return {
        menuitems: [],
        enabled: false,
        init() {
            this.i = this;
        }
    };
}
function app() {
    return {
        username: null,
        permission: 0,
        init() {
            this.i = this;
        },
    }
}

$(document).bind("alpine:init", () => {
    Alpine.data("ContextMenu", _ => ContextMenu);
    Alpine.data("App", _ => App);
    socket.emit("feed", {
        type: "render"
    });
    socket.emit("alive");
});
socket.on("feed", res => {
    switch (res.type) {
        case "render":
            App.i.permission = res.permission;
            App.i.username = res.username;
            break;
        case "posts":
            console.log(res.data);
            App.i.mainposts = res.data;
            seenuuids = res.uuids;
            break;
        case "moreposts":
            console.log(res.data);
            App.i.mainposts = App.i.mainposts.concat(res.data);
            seenuuids = seenuuids.concat(res.uuids);
            break;
    }
});
socket.on("subscribe", _ => {
    console.log("attempting to resubscribe");
    run().catch(error => console.error(error));
});
socket.on("sign", res => {
    switch (res.type) {
        case "out":
            Cookies.remove("token");
            window.location.replace("/");
    }
});
setInterval(() => {
    socket.emit("alive");
}, 10000);