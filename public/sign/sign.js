var socket = io();
var app;
$(() => {
    app = PetiteVue.createApp({
        signup: false,
        username: "",
        password: "",
        confirmpassword: "",
        mounted() {
            socket.on("sign", this.s_sign);
        },
        sign() {
            if (this.signup) {
                if (this.password == this.confirmpassword) {
                    socket.emit("sign", {
                        type: "up",
                        username: this.username,
                        password: this.password
                    });
                } else {
                    alert("passwords must match!");
                }
            } else {
                socket.emit("sign", {
                    type: "in",
                    username: this.username,
                    password: this.password
                });
            }
        },
        s_sign: (res) => {
            switch (res.type) {
                case "in":
                    switch (res.res) {
                        case 200:
                            break;
                        case "nouser":
                            alert("incorrect username");
                            break;
                        case "nopass":
                            alert("incorrect password");
                            break;
                    }
                    break;
                case "up":
                    switch (res.res) {
                        case 200:
                            alert("account made or something");
                            break;
                        case "taken":
                            alert("that username is already taken");
                            break;
                    }
                    break;
                case "out":
                    break;
                case "auth":
                    console.log(res.token);
                    Cookies.set("token", res.token, {
                        path: "/"
                    });
                    window.location.replace("/profile");
                    break;
            }
        }

    }).mount();
});