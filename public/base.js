const expand = (e, s = "inline") => $(e)[0].style.display = $(e)[0].style.display == "none" ? s : "none";

const l = (d) => console.log(d);