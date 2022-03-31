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
var tabmap = {};


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
				// thank you javascript
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
function Tab(tab) {
	return {
		tab,
		input: "",
		chatmodel: null,
		fetchoffset: 0,
		init() {
			tabmap[tab.uuid] = this;
			this.fetch();
		},
		initTab() {
			this.chatmodel = this.$el;
			setTimeout(() => {
				this.$watch("tab", (v, oldv) => {
					// console.log(oldv)
					v.users.forEach((user, index) => {
						if (user.online != oldv.users[index]?.online) {
							if (settings["notifications.log"].value) {
								sendNotif(
									`User ${user.username} ${user.online ? "joined" : "left"}!`,
									""
								);
							}

						}
					});
					// $(this.$el).scrollTop(99999999);
				});
				this.autoscroll();
			}, 50);
		},
		fetch() {
			socket.emit("chat", {
				type: "fetch",
				uuid: tab.uuid,
				offset: this.fetchoffset
			})
		},
		autoscroll() {
			$(this.chatmodel).scrollTop(999999);
		},
		useractions(user) {
			ContextMenu.i.enabled = true;
			ContextMenu.i.menuitems = [
				{
					name: `${user.friend ? "remove" : "add"} friend`,
					action: _ => {
						socket.emit("chat", {
							type: "friend",
							username: user.username
						});
					}
				}, {
					name: `${user.enemy ? "remove" : "add"} enemy`,
					action: _ => {
						socket.emit("chat", {
							type: "enemy",
							username: user.username
						});
					}
				},
				{
					name: `DM ${user.username}`,
					action: _ => {
						socket.emit("chat", {
							type: "dm",
							username: user.username
						});
					}
				},
				this.permission >= 3 ? {
					name: `Remove ${user.username} from chat`,
					action: _ => {
						socket.emit("chat", {
							type: "removeuser",
							uuid: tab.uuid,
							username: user.username
						});
					}
				} : {},
			];
		},
		send() {
			if (cansendmessage) {
				socket.emit("chat", {
					type: "send",
					uuid: this.tab.uuid,
					message: this.input
				});
				this.input = "";
				cansendmessage = false;
				setTimeout(() => (cansendmessage = true), slowmodetimer);
			}
		}
	};
}
function app() {
	return {
		username: null,
		permission: 0,
		tabs: [],
		friends: [],
		users: [],
		activetabid: null,
		menutab: "settings",
		settings,
		publicrooms: [],
		init() {
			this.i = this;
		},
		uploadPfp() {
			let elm = $("<input type='file'>");
			elm.click();
			elm[0].onchange = e => {
				let file = e.target.files[0];
				var formData = new FormData();
				formData.append("file", file);
				$.ajax({
					url: "/api/upload",
					type: "POST",
					data: formData,
					processData: false, // tell jQuery not to process the data
					contentType: false, // tell jQuery not to set contentType
					success: function (data) {
						console.log(data);
						alert(data.message);
					}
				});
				elm.remove();
			};
		},
		useractions(user) {
			ContextMenu.i.enabled = true;
			ContextMenu.i.menuitems = [
				{
					name: `${user.friend ? "remove" : "add"} friend`,
					action: _ => {
						socket.emit("chat", {
							type: "friend",
							username: user.username
						});
					}
				},
				{
					name: `DM ${user.username}`,
					action: _ => {
						socket.emit("chat", {
							type: "dm",
							username: user.username
						});
					}
				}
			];
		},
		joinRoom(room) {
			socket.emit("chat", {
				type: "joinroom",
				uuid: room.uuid
			});
		},
		requestPublicRooms() {
			socket.emit("chat", {
				type: "requestpublicrooms"
			});
		},
		roomactions(tab) {
			ContextMenu.i.enabled = true;
			ContextMenu.i.menuitems = [
				tab.owner == this.username || tab.public
					? {
						name: "Invite Friends",
						action: _ => {
							this.$nextTick(() => {
								ContextMenu.i.enabled = true;
								ContextMenu.i.menuitems = friends.map(_ => {
									return {
										name: _.username,
										action: () => {
											socket.emit("chat", {
												type: "adduser",
												uuid: this.activetabid,
												username: _.username
											});
										}
									};
								});
							});
						}
					}
					: { name: "", action: _ => _ },
				tab.owner == this.username
					? {
						name: "Make public",
						action: _ => {
							socket.emit("chat", {
								type: "changevisibility",
								uuid: this.activetabid
							});
						}
					}
					: { name: "", action: _ => _ },
				tab.owner == this.username
					? {
						name: "Rename Room",
						action: _ => {
							socket.emit("chat", {
								type: "rename",
								uuid: this.activetabid,
								newname: prompt("new name?")
							});
						}
					}
					: { name: "", action: _ => _ },
				{
					name: "Leave Room",
					action: _ => {
						socket.emit("chat", {
							type: "leave",
							uuid: this.activetabid
						});
					}
				},
				{
					name: "Delete Room",
					action: _ => {
						socket.emit("chat", {
							type: "leave",
							uuid: this.activetabid
						});
					}
				}
			];
		}
	};
}

$(document).bind("alpine:init", () => {
	Alpine.data("ContextMenu", _ => ContextMenu);
	Alpine.data("App", _ => App);
	socket.emit("alive");
	socket.emit("feed", {
		type: "render"
	});
});
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
			if (tab.missed == null) {
				tab.missed = 0;
			}
			if (App.i.activetabid != tab.uuid) {
				tab.missed++;
			}
			if (settings["notifications.message"].value) {
				sendNotif(res.sender, res.message);
			}
			setTimeout(() => tabmap[res.roomuuid].autoscroll(), 20);
			break;
		case "requestpublicrooms":
			App.i.publicrooms = res.rooms;
			break;
		case "fetch": {
			let tab = App.i.tabs.find(_ => _.uuid == res.uuid);
			tab.messages = tab.messages ?? [];
			res.messages.reverse().forEach(msg => {
				tab.messages.unshift({ sender: msg.sender, message: msg.message });
			});
			$(tabmap[res.uuid].chatmodel).scrollTop(17 * 50);
			tabmap[res.uuid].fetchoffset = res.offset;
		}
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
socket.on("subscribe", _ => {
	console.log("attempting to resubscribe");
	run().catch(error => console.error(error));
});
socket.on("userlist", data => {
	let rooms = [];
	friends = data.users.filter(_ => {
		return _.friend;
	});
	users = data.users.filter(_ => {
		return !_.friend;
	});

	data.rooms.forEach(room => {
		let dt = data.users.filter(_ => {
			return room.users.includes(_.username);
		});
		room.users = dt;
		let ftab = App.i.tabs.find(r => r.uuid == room.uuid);
		if (ftab != null) {
			ftab.users = dt;
		} else {
			App.i.tabs.push(room);
		}
	});
	if (App.i.activetabid == null && rooms.length > 0) {
		// App.i.activetabid = App.i.tabs[0].uuid;
	}
	App.i.friends = friends;
	App.i.users = users;
	// App.i.tabs = rooms;
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
