// yes, i know this has absolutely nothing to do with ftp, i also don't care.
const socket = io();

const App = app();

function app() {
	return {
		permissions: {},
		username: null,
		users: [],
		me: [],
		selectedfolder: "me",
		selectedfile: "upload",
		description: "",
		init() {
			this.i = this;
		},
		deletefile(selectedfile) {
			$.post("/api/ftp/delete", { url: selectedfile.url }, res => {
				if (!res.success) {
					alert(res.message);
				} else {
					window.location.reload();
				}
			});
		}
	};
}
function Upload() {
	return {
		url: "",
		message: "",
		unlisted: false,
		private: false,
		success: false,
		type: "raw",
		upload() {
			$.post("/api/ftp/urlavailable", { url: this.url }, res => {
				if (res.status) {
					let elm = $("<input type='file'>");
					elm.click();
					elm[0].onchange = e => {
						let file = e.target.files[0];
						var formData = new FormData();
						formData.append("file", file);
						formData.append("url", this.url);
						if (this.private) {
							this.unlisted = true;
						}
						formData.append("private", this.private);
						formData.append("unlisted", this.unlisted);
						formData.append("type", this.type);
						formData.append("description", this.description);
						$.ajax({
							url: "/api/ftp/upload",
							type: "POST",
							data: formData,
							processData: false, // tell jQuery not to process the data
							contentType: false, // tell jQuery not to set contentType
							success: data => {
								this.success = data.status;
								this.message = data.message;
							}
						});
						elm.remove();
					};
				} else {
					this.success = false;
					this.message = "url taken. choose another one";
				}
			});
		}
	};
}
$(document).bind("alpine:init", () => {
	Alpine.data("App", _ => App);
	$.get("/api/me", data => {
		App.i.username = data.username;
		App.i.permissions = data.permissions;
	});
	$.get("/api/ftp", data => {
		App.i.me = data.me;
		App.i.users = data.users;
	});
});
