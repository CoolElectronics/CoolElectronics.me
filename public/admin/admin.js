const socket = io();

socket.emit("alive");
$(document).ready(() => {
    $("#home").click(() => window.location.replace("/"));
    $("#sign-out").click(() => {
        socket.emit("logout");
        Cookies.remove("username", {
            path: "/"
        });
        Cookies.remove("authkey", {
            path: "/"
        });
        window.location.replace("/");
    });
});