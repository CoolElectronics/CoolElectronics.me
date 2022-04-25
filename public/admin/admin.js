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
			$.post("/api/admin", {
				type: "updatepermission",
				username: usr.username,
				permissions: val
			}, res => alert(res));
		},
		wake() {
			$.post("/api/admin", {
				type: "wake"
			}, res => alert(res))
		},
		crd() {
			$.post("/api/admin", {
				type: "crd"
			}, res => alert(res))
		},
		mc() {
			$.post("/api/admin", {
				type: "mc"
			}, res => alert(res))
		},
		manage() {
			menuenabled = true;
		},
		signout() {
			Cookies.remove("token", {
				path: "/"
			});
			window.location.replace("/");
		}
	};
}
$(document).bind("alpine:init", () => {
	Alpine.data("App", _ => App);
	$.get("/api/admin", data => {
		App.i.users = data;
	});
});
