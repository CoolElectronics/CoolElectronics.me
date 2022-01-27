var startingminute = [483];
var minute = [526, 578, 624, 670, 720, 787, 836, 883, 930];
var ci = 0;

$(document).ready(() => {
    var text = $("#class-timer-text");


    let initial = new Date();
    for (let i = 0; i < minute.length; i++) {
        let timeminutes = initial.getHours() * 60 + initial.getMinutes();
        if (timeminutes >= minute[i]) {
            continue;
        } else {
            ci = i;
            break;
        }
    }
    tick();


    setInterval(tick, 1000);

    function tick() {
        let date = new Date();
        let timeminutes = date.getHours() * 60 + date.getMinutes();
        if (timeminutes > minute[ci]) {
            ci++;
        }
        text[0].innerHTML = (minute[ci] - timeminutes) + ":" + (60 - date.getSeconds()) + ` Left in period ${ci + 1}`;
    }
});