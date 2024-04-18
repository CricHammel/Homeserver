import { checkLoginStatus } from "../auth/loginStatus.js"


checkLoginStatus().then((json) => {
    if (!json.loggedIn) {
        alert("You need to be logged in to access the dashboard!");
        window.open("/", "_self");
    }
});