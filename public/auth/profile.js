import BASE_URL from "../../config.js";
import { checkLoginStatus } from "./loginStatus.js";

document
    .getElementById("username-form")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const newName = document.getElementById("new-username").value;

        try {
            const response = await fetch(`${BASE_URL}/users/change-username`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newName: newName }),
            });

            if (response.status === 201) {
                alert("Changed username successfully!");
            } else {
                alert("Username change failed. " + (await response.text()));
            }
        } catch (error) {
            console.log("Error while changing username: " + error);
            alert("Error while changing username: " + error);
        }

        location.reload();
    });

document
    .getElementById("password-form")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const password = document.getElementById("old-password").value;
        const newPassword = document.getElementById("new-password").value;

        try {
            const response = await fetch(`${BASE_URL}/users/change-password`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password: password,
                    newPassword: newPassword,
                }),
            });

            if (response.status === 201) {
                alert("Changed password successfully!");
            } else {
                alert("Password change failed. " + (await response.text()));
            }
        } catch (error) {
            console.log("Error while changing password: " + error);
            alert("Error while changing password: " + error);
        }

        setTimeout(() => {
            window.open("./profile.html", "_self");
        }, 1);
    });

const titleElement = document.getElementById("title");
const formContainer = document.getElementById("form-container");
const errorElement = document.getElementById("error");

checkLoginStatus()
    .then((json) => {
        if (json.loggedIn) {
            titleElement.style.display = "inherit";
            formContainer.style.display = "inherit";
            document.getElementById("username").innerText = json.username;
        } else {
            errorElement.style.display = "inherit";
        }
    })
    .catch((error) => {
        errorElement.innerText =
            "There was an error processing the login status: " + error;
    });
