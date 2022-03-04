$(document).ready((e) => {
    $("#nv-home").click(() => rd("/"));
    $("#nv-signin").click(() => rd("/sign"));
    $("#nv-games").click(() => rd("/games"));
    $("#nv-github").click(() => rd("https://github.com/CoolElectronics?tab=overview"));
    $("#nv-contact").click(() => rd("mailto://kveonl98@gmail.com"));
});
const rd = (w) => window.location.replace(w);