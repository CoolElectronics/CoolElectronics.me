const socket = io();

const App = app();

function app() {
	return {
		collections: [],
		permissions: {},
		username: null,
		activecollection: "",
		init() {
			this.i = this;
		},
		addcollection() {
			$.post("/api/games", {
				type: "addcollection",
				name: prompt("what is the collection called")
			});
			location.reload();
		}
	};
}
function Collection(collection) {
	return {
		collection,
		games: collection.games,
		addgame() {
			let name = prompt("Name");
			let url = prompt("url? (or local resource)")
			$.post("/api/games", {
				type: "addgame",
				collection: collection._id,
				name,
				url

			});
			App.i.collections.find(g => g._id == collection._id).games.push({
				name,
				url,
			})
		},
		del() {
			if (confirm("are you sure you want to delete this collection?")) {
				$.post("/api/games", { type: "deletecollection", id: collection._id });
				App.i.collections = App.i.collections.filter(c => { return c._id != collection._id });
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
				$.post("/api/games", {
					type: "deletegame",
					collection: collection._id,
					name: game.name
				});
				App.i.collections[App.i.collections.findIndex(g => g._id == collection._id)] = App.i.collections.find(g => g._id == collection._id).games.filter(g => g.name != game.name)
			}
		}
	};
}
$(document).bind("alpine:init", () => {
	Alpine.data("App", _ => App);
	$.get("/api/me", data => {
		App.i.username = data.username;
		App.i.permissions = data.permissions;
	});
	$.get("/api/games", data => {
		App.i.collections = data;
	});
});
