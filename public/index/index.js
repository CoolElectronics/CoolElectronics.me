const App = app();


function app(){
    return {
        
    }
}

$(document).bind("alpine:init", () => {
    Alpine.data("App", _ => App);
});
