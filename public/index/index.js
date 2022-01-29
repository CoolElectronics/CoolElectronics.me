$(document).ready(() => {
    l("initializing");
    document.body.style.height = $(window).height();
    $("#expand-about").click(() => expand("#about"));
    $("#expand-features").click(() => expand("#features"));
});