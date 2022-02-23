
var socket = io();
var ContextMenu = contextMenu();
var friends = [];
var users = [];
var App = app();

function contextMenu() {
    return {
        menuitems: [],
        enabled: false,
        init() {
            this.i = this;
        }
    }
}
function Tab(tab) {
    return {
        tab,
        input: "",
        init() {
        },
        initTab() {
            setTimeout(() => {
                $(this.$el).scrollTop(999999);
                this.$watch('tab', (v, oldv) => {
                    v.users.forEach((user, index) => {
                        if (user.online != oldv.users[index].online) {
                            sendNotif(`User ${user.username} ${user.online ? "joined" : "left"}!`, "");
                        }
                    });
                    $(this.$el).scrollTop(99999999);
                });
            }, 50)
        },
        useractions(user) {
            showUserActions(user);
        },
        send() {
            socket.emit("chat", {
                type: "send",
                uuid: this.tab.uuid,
                message: this.input,
            });
            this.input = "";
        }
    }
}
function app() {
    return {
        username: null,
        permission: 0,
        tabs: [],
        friends: [],
        users: [],
        activetabid: null,
        menutab: 'settings',
        publicrooms: [],
        init() {
            this.i = this;
        },
        useractions(user) {
            showUserActions(user);
        },
        joinRoom(room) {
            socket.emit("chat", {
                type: "joinroom",
                uuid: room.uuid,
            })
        },
        requestPublicRooms() {
            socket.emit("chat", {
                type: "requestpublicrooms"
            });
        },
        roomactions(tab) {
            ContextMenu.i.enabled = true;
            ContextMenu.i.menuitems = [
                tab.owner == this.username || tab.public ? {
                    name: "Invite Friends",
                    action: _ => {
                        this.$nextTick(() => {
                            ContextMenu.i.enabled = true;
                            ContextMenu.i.menuitems = friends.map(_ => {
                                return {
                                    name: _.username, action: () => {
                                        socket.emit("chat", {
                                            type: "adduser",
                                            uuid: this.activetabid,
                                            username: _.username,
                                        });
                                    }
                                }
                            })
                        })
                    }
                } : { name: "", action: _ => _ },
                tab.owner == this.username ? {
                    name: "Make public",
                    action: _ => {
                        socket.emit("chat", {
                            type: "changevisibility",
                            uuid: this.activetabid
                        });
                    }
                } : { name: "", action: _ => _ },
                tab.owner == this.username ? {
                    name: "Rename Room",
                    action: _ => {
                        socket.emit("chat", {
                            type: "rename",
                            uuid: this.activetabid,
                            newname: prompt("new name?"),
                        });
                    }
                } : { name: "", action: _ => _ },
                {
                    name: "Leave Room",
                    action: _ => {
                        socket.emit("chat", {
                            type: "leave",
                            uuid: this.activetabid,
                        });
                    }
                },
                {
                    name: "Delete Room",
                    action: _ => {
                        socket.emit("chat", {
                            type: "leave",
                            uuid: this.activetabid,
                        });
                    }
                }
            ]
        }
    }
}

$(document).bind("alpine:init", () => {
    Alpine.data("ContextMenu", _ => ContextMenu);
    Alpine.data("App", _ => App);
    socket.emit("alive");
    socket.emit("feed", {
        type: "render",
    });
})
socket.on("chat", res => {
    switch (res.type) {
        case "friend":
            if (res.result) {
                // alert("nice! friended this user!");
            } else {
                alert(res.error);
            }
            break;
        case "message":
            let tab = App.i.tabs.find(_ => _.uuid == res.roomuuid);
            tab.messages.push({ sender: res.sender, message: res.message });
            sendNotif(res.sender, res.message);
            break;
        case "requestpublicrooms":
            App.i.publicrooms = res.rooms;
            break;
    }
});
socket.on("feed", res => {
    switch (res.type) {
        case "render":
            App.i.permission = res.permission;
            App.i.username = res.username;
            break;
    }
});
socket.on("userlist", data => {
    let rooms = [];
    friends = data.users.filter(_ => { return _.friend });
    users = data.users.filter(_ => { return !_.friend });

    data.rooms.forEach(room => {
        room.users = data.users.filter(_ => {
            return room.users.includes(_.username);
        })
        rooms.push(room);
    });
    if (App.i.activetabid == null && rooms.length > 0) {
        App.i.activetabid = rooms[0].uuid;
    }
    App.i.friends = friends;
    App.i.users = users;
    App.i.tabs = rooms;


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
$(window).click((event) => {
    Notification.requestPermission();
});
function showUserActions(user) {
    ContextMenu.i.enabled = true;
    ContextMenu.i.menuitems = [
        {
            name: `${user.friend ? "remove" : "add"} friend`,
            action: _ => {
                socket.emit("chat", {
                    type: "friend",
                    username: user.username,
                });
            }
        },
        {
            name: `DM ${user.username}`,
            action: _ => {
                socket.emit("chat", {
                    type: "dm",
                    username: user.username
                })
            }
        }
    ]
}
function sendNotif(head, body) {
    if (!document.hasFocus()) {
        new Notification(head, {
            body: body,
        });
    }
}