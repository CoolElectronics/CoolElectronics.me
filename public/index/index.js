$(document).ready(() => {
    l("initializing");
    document.body.style.height = $(window).height();
    $("#expand-about").click(() => expand($("#about")[0]));
    $("#expand-features").click(() => expand($("#features")[0]));
});

const expand = (e) => e.style.display = e.style.display == "none" ? "inline" : "none";

const l = (d) => console.log(d);