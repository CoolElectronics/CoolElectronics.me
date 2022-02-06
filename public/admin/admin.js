const socket = io();

socket.emit("alive");
$(document).ready(() => {
  $("#button-crd-toggle").click(() => {
    socket.emit("admin", {
      type: "crd",
    });
  });
  $("#home").click(() => window.location.replace("/"));
  $("#sign-out").click(() => {
    socket.emit("logout");
    Cookies.remove("username", {
      path: "/",
    });
    Cookies.remove("authkey", {
      path: "/",
    });
    window.location.replace("/");
  });
});
