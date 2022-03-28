const socket = io();

const App = app();

function app() {
	return {
		collections: [],
		permission: -1,
		username: null,
		activecollection: "",
		init() {
			this.i = this;
		},
		addcollection() {
			socket.emit("games", {
				type: "addcollection",
				name: prompt("what is the collection called")
			});
		}
	};
}
function Collection(collection) {
	return {
		collection,
		games: collection.games,
		addgame() {
			socket.emit("games", {
				type: "addgame",
				collection: collection._id,
				name: prompt("Name"),
				url: prompt("url? (or local resource)")
			});
		},
		del() {
			if (confirm("are you sure you want to delete this collection?")) {
				socket.emit("games", { type: "deletecollection", id: collection._id });
			}
		}
	};
}
function Game(game, collection) {
	return {
		game,
		collection,
		clicked() {
			$("#mainframe").prop("src", this.game.url);
		},
		del() {
			if (confirm("are you sure you want to delete this game?")) {
				socket.emit("games", {
					type: "deletegame",
					collection: collection._id,
					name: game.name
				});
			}
		}
	};
}
$(document).bind("alpine:init", () => {
	Alpine.data("App", _ => App);
	socket.emit("alive");

	socket.emit("feed", {
		type: "render"
	});
	socket.emit("games", {
		type: "fetch"
	});

	socket.on("games", res => {
		console.log(res.data);
		App.i.collections = res.data;
	});
	socket.on("feed", res => {
		App.i.username = res.username;
		App.i.permission = res.permission;
	});
});
