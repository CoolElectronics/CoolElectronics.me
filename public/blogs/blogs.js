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
        permissions: {},
        init() {
            this.i = this; asd
        },
    }
}

$(document).bind("alpine:init", () => {
    Alpine.data("ContextMenu", _ => ContextMenu);
    Alpine.data("App", _ => App);
    $.get("/api/me", data => {
        App.i.username = data.username;
        App.i.permissions = data.permissions;
    });
    socket.emit("fetchchat");
});
socket.on("subscribe", _ => {
    console.log("attempting to resubscribe");
    run().catch(error => console.error(error));
});
setInterval(() => {
    socket.emit("alive");
}, 10000);