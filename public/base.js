function signout() {
    Cookies.remove("token");
    window.location.replace("/");
}
const l = (d) => console.log(d);