const socket = io();
const App = app();

function app() {
	return {
		users: [],
		menuenabled: false,
		init() {
			this.i = this;
		},
		updatepermission(usr, val) {
			console.log(val);
			socket.emit("admin", {
				type: "updatepermission",
				username: usr.username,
				permission: val
			});
		},
		crd() {
			socket.emit("admin", {
				type: "crd"
			});
		},
		mc() {
			socket.emit("admin", {
				type: "mc"
			});
		},
		manage() {
			menuenabled = true;
		},
		signout() {
			socket.emit("logout");
			Cookies.remove("username", {
				path: "/"
			});
			Cookies.remove("authkey", {
				path: "/"
			});
			window.location.replace("/");
		}
	};
}
$(document).bind("alpine:init", () => {
	Alpine.data("App", _ => App);
	socket.emit("alive");
	socket.emit("feed", {
		type: "admin"
	});

	socket.on("feed", res => {
		switch (res.type) {
			case "admin":
				App.i.users = res.users;
				break;
		}
	});
	socket.on("admin", res => {
		alert(res);
	});
});
