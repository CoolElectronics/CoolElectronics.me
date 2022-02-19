var socket = io();
var app;

var vscope;

$(() => {
    PetiteVue.createApp({
        username: null,
        pfprc: null,
        permission: null,
        tabs: null,
        activetab: null,
        Tab,
        ContextMenu,
        TabButton,
        isactive(tab) {
            alert(tab);
        },
        mounted() {
            vscope = this;
            console.log(this);
            socket.on("chat", this.s_chat);
            socket.on("feed", this.s_feed);
            socket.on("userlist", this.s_userlist);


            socket.emit("alive");
            socket.emit("feed", {
                type: "render",
            });
        },
        s_chat: function (res) {
            switch (res.type) {

            }
        },
        s_feed: function (res) {
            switch (res.type) {
                case "render":
                    this.permission = res.permission;
                    this.username = res.username;
                    this.pfprc = `/img/${res.username}/pfp.png`;
                    break;
            }
        },
        s_userlist: function (data) {
            console.log("list recieved");
            this.tabs = data.rooms;
            // let tabuuids = tabs.map((t) => {
            //     return t.uuid;
            // });
            // let datuuids = data.rooms.map((d) => {
            //     return d.uuid;
            // });
            // tabs.forEach((t) => {
            //     if (!(t instanceof SettingsTab)) {
            //         if (!datuuids.includes(t.uuid)) {
            //             t.delete();
            //         }
            //     }
            // });
            // data.rooms.forEach((d) => {
            //     tabs.forEach((t) => {
            //         if (t.uuid == d.uuid) {
            //             t.update(d);
            //         }
            //     });
            //     if (!tabuuids.includes(d.uuid)) {
            //         tabs.push(new Tab(d));
            //     }
            // });
            // if (activetab == undefined) {
            //     SwitchTab(tabs[tabs.length - 1]);
            // }
            // data.users.forEach((u) => {
            //     if (u.friend) {
            //         if (
            //             !storedfriendslist
            //                 .map((s) => {
            //                     return s.username;
            //                 })
            //                 .includes(u.username)
            //         ) {
            //             storedfriendslist.push(u);
            //         }
            //     }
            // });
            // tabs.forEach((t) => {
            //     t.updateUsers(data.users);
            // });
        }

    }).mount();
});
function Tab(tab) {
    return {
        $template: "#Tab",
        tab
    }
}
function TabButton(tab) {
    return {
        tab
    }
}
function ContextMenu() {
    return { menuitems: [{ name: "e" }] }
}