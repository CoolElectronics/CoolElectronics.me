var period = 0;
var minute = [526, 578, 624, 670, 720, 787, 836, 883, 930];

function Timer() {
  return {
    inschool: true,
    time: 1234,
    init() {
      let initial = new Date();
      let timeminutes = initial.getHours() * 60 + initial.getMinutes();
      if (timeminutes > minute[minute.length - 1] || timeminutes < minute[0]) {
        this.inschool = false;
      } else {
        for (let i = 0; i < minute.length; i++) {

          if (timeminutes >= minute[i]) {
            continue;
          } else {
            period = i;
            break;
          }
        }
        setInterval(_ => this.tick(this), 1000);
      }
    },
    tick: function (i) {
      let date = new Date();
      let timeminutes = date.getHours() * 60 + date.getMinutes();
      if (timeminutes > minute[period]) {
        period++;
      }
      i.time = (minute[period] - timeminutes) + ":" + (60 - date.getSeconds()) + ` Left in period ${period + 1}`;
    }
  }
};