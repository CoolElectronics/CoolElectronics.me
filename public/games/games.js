const socket = io();

collections = [];

socket.emit("alive");
$(document).ready(() => {
  setInterval(() => {
    socket.emit("alive");
  }, 10000);
  socket.emit("games", {
    type: "fetch",
  });
});
socket.on("games", (req) => {
  switch (req.type) {
    case "fetch":
      console.log(req);
      req.data.forEach((collection) => {
        console.log(collection);
        collections.push(new Collection(collection));
      });
      break;
  }
});

class Collection {
  constructor(data) {
    this.name = data.name;
    this.collection = this.appendCollection();

    data.games.forEach((g) => {
      this.appendGame(g);
    });
  }
  appendGame(g) {
    let game = $("<div class='game'>");
    console.log("test");
    this.collection.children().append(game);
    game.text(g.name);
    game.click(() => {
      $("#mainframe").prop("src", g.url);
    });
  }
  appendCollection() {
    let selbar = $("#selbar");
    let outer = $("<div class='m-text t3 col-md1'>");
    let inner = $("<div class='m-hidden'>");

    outer.text(this.name + " >");
    outer.click(() => {
      if (inner[0].classList.contains("m-hidden")) {
        inner.removeClass("m-hidden");
      } else {
        inner.addClass("m-hidden");
      }
    });
    selbar.append(outer);
    outer.append(inner);
    return outer;
  }
}
