var settings = {
    "notifications.global": {
        text: "Notifications",
        defaultValue: true,
    },
    "notifications.log": {
        text: "Leave / Join Notifications",
        defaultValue: true
    },
    "notifications.message": {
        text: "Message Notifications",
        defaultValue: true
    }
};
var socket = io();
var ContextMenu = contextMenu();
var friends = [];
var users = [];
var App = app();

var slowmodetimer = 1000;
var cansendmessage = true;

function contextMenu() {
    return {
        menuitems: [],
        enabled: false,
        init() {
            this.i = this;
        }
    };
}
function Post(post) {
    return {
        post,
        init() {

        }
    }
}
function ToggleSetting(toggle) {
    return {
        toggle,
        obj: false,
        init() {
            if (Cookies.get(toggle.text) == null) {
                Cookies.set(toggle.text, toggle.defaultValue, {
                    path: "/",
                    sameSite: "strict",
                    expires: 365,
                });
                toggle.value = toggle.defaultValue;
                this.obj = toggle.value;
            } else {
                this.obj = Cookies.get(toggle.text) === 'true';
                toggle.value = this.obj;
            }
        },
        change() {
            Cookies.set(toggle.text, this.obj, {
                path: "/",
                sameSite: "strict",
                expires: 365,
            });
            toggle.value = this.obj;
        }
    };
}
function app() {
    return {
        username: null,
        permission: 0,
        friends: [],
        users: [],
        mainposts: [{ body: "oaisjhdoashpfuishamoifuahsgiuofgh + ratio" }],
        init() {
            this.i = this;
        },
        roomactions(tab) {
        }
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
$(window).click(event => {
    Notification.requestPermission();
});

function sendNotif(head, body) {
    if (!document.hasFocus() && settings["notifications.global"].value) {
        new Notification(head, {
            body: body
        });
    }
}
