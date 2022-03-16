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
var seenuuids = [];

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
        comment: "",
        init() {

        },
        postComment() {
            console.log(post.uuid);
            socket.emit("feed", {
                type: "comment",
                username: post.username,
                uuid: post.uuid,
                comment: this.comment
            });
            post.comments.push({
                username: this.username, // yes i know you can do the cool es5 thing but alpine
                body: this.comment
            });
            this.comment = "";
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
        points: -Infinity,
        postbody: "",
        mainposts: [],
        activepost: null,
        init() {
            this.i = this;
        },
        loadmore() {
            socket.emit("feed", {
                type: "showmore",
                offset: seenuuids,
            })
        },
        post() {
            socket.emit("feed",
                {
                    type: "post",
                    body: this.postbody.innerText
                });
            this.postbody.innerText = "";
        }
    }
}

$(document).bind("alpine:init", () => {
    Alpine.data("ContextMenu", _ => ContextMenu);
    Alpine.data("App", _ => App);
    socket.emit("feed", {
        type: "render"
    });
    socket.emit("feed", {
        type: "getposts"
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