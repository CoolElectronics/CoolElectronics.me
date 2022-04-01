var app;
function app() {
    return {
        signup: false,
        username: "",
        password: "",
        confirmpassword: "",
        sign() {
            if (this.signup) {
                if (this.password == this.confirmpassword) {
                    $.post("/api/signup", {
                        username: this.username,
                        password: this.password
                    }, dt => {
                        if (dt.success) {
                            window.location = "/home";
                        } else {
                            alert(dt.reason);
                        }
                    })
                } else {
                    alert("passwords must match!");
                }
            } else {
                $.post("/api/signin", {
                    username: this.username,
                    password: this.password
                }, dt => {
                    if (dt.success) {
                        window.location = "/home";
                    } else {
                        alert(dt.reason);
                    }
                })
            }

        }
    }
}