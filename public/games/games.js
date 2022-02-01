const socket = io();

socket.emit("alive");
$(document).ready(() => {
    setInterval(() => {
        socket.emit("alive")
    }, 10000);

});