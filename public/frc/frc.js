
var socket = io();

var App = app();

function app() {
    return {
        matchnum: 0,
        highscores: 0,
        lowscores: 0,
        missed: 0,
        teamnumber: 1493,
        climb: 0,
        note: "",
        taxi: false,

        init() {
            this.i = this;
        },
        submit() {

            socket.emit("frc", {
                type: "data",
                highscores: this.highscores,
                lowscores: this.lowscores,
                missed: this.missed,
                matchnum: this.matchnum,
                teamnumber: this.teamnumber,
                note: this.note,
                climb: this.climb,
                taxi: this.taxi
            })
            this.climb = 0;
            this.highscores = 0;
            this.lowscores = 0;
            this.missed = 0;
            this.matchnum++;
            this.teamnumber = 0;
            this.note = "";
            this.taxi = false;
        }
    }
}

$(document).bind("alpine:init", () => {
    Alpine.data("App", _ => App);
});