
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
            console.log(tab);
            window.tabx = this;

        },
        useractions(user) {
            ContextMenu.i.enabled = true;
            ContextMenu.i.menuitems = [
                {
                    name: `${user.friend ? "add" : "remove"} friend`,
                    action: _ => {
                        socket.emit("chat", {
                            type: "friend",
                            username: user.username,
                        });
                    }
                }
            ]
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
        activetabid: null,
        init() {
            this.i = this;
        },
        roomactions(tab) {
            ContextMenu.i.enabled = true;
            ContextMenu.i.menuitems = [
                tab.owner == this.username ? {
                    name: "Invite Friends",
                    action: _ => {
                        window.ev = this;
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
    // Alpine.data("Tabs", _ => Tabs);


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
            // sendNotif(res.sender, res.message);
            break;
        // case "massmessage":
        //     res.messages.forEach(appendMessage);
        //     break;
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
    console.log(data);
    let rooms = [];
    friends = data.users.filter(_ => { return _.friend });
    users = data.users.filter(_ => { return !_.friend });

    data.rooms.forEach(room => {
        room.users = data.users.filter(_ => {
            return room.users.includes(_.username);
        })
        rooms.push(room);
    });

    App.i.tabs = rooms;


});

// var app;

// var vscope;

// $(() => {
//     PetiteVue.createApp({
//         username: null,
//         pfprc: null,
//         permission: null,
//         tabs: null,
//         activetab: null,
//         Tab,
//         ContextMenu,
//         TabButton,
//         isactive(tab) {
//             alert(tab);
//         },
//         mounted() {
//             vscope = this;
//             console.log(this);
//             socket.on("chat", this.s_chat);
//             socket.on("feed", this.s_feed);
//             socket.on("userlist", this.s_userlist);


//             socket.emit("alive");
//             socket.emit("feed", {
//                 type: "render",
//             });
//         },
//         s_chat: function (res) {
//             switch (res.type) {

//             }
//         },
//         s_feed: function (res) {
//             switch (res.type) {
//                 case "render":
//                     this.permission = res.permission;
//                     this.username = res.username;
//                     this.pfprc = `/img/${res.username}/pfp.png`;
//                     break;
//             }
//         },
//         s_userlist: function (data) {
//             console.log("list recieved");
//             this.tabs = data.rooms;
//             // let tabuuids = tabs.map((t) => {
//             //     return t.uuid;
//             // });
//             // let datuuids = data.rooms.map((d) => {
//             //     return d.uuid;
//             // });
//             // tabs.forEach((t) => {
//             //     if (!(t instanceof SettingsTab)) {
//             //         if (!datuuids.includes(t.uuid)) {
//             //             t.delete();
//             //         }
//             //     }
//             // });
//             // data.rooms.forEach((d) => {
//             //     tabs.forEach((t) => {
//             //         if (t.uuid == d.uuid) {
//             //             t.update(d);
//             //         }
//             //     });
//             //     if (!tabuuids.includes(d.uuid)) {
//             //         tabs.push(new Tab(d));
//             //     }
//             // });
//             // if (activetab == undefined) {
//             //     SwitchTab(tabs[tabs.length - 1]);
//             // }
//             // data.users.forEach((u) => {
//             //     if (u.friend) {
//             //         if (
//             //             !storedfriendslist
//             //                 .map((s) => {
//             //                     return s.username;
//             //                 })
//             //                 .includes(u.username)
//             //         ) {
//             //             storedfriendslist.push(u);
//             //         }
//             //     }
//             // });
//             // tabs.forEach((t) => {
//             //     t.updateUsers(data.users);
//             // });
//         }

//     }).mount();
// });
// function Tab(tab) {
//     return {
//         $template: "#Tab",
//         tab
//     }
// }
// function TabButton(tab) {
//     return {
//         tab
//     }
// }
// function ContextMenu() {
//     return { menuitems: [{ name: "e" }] }
// }