import BASE_URL from "../config.js";

document
    .getElementById("loginForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${BASE_URL}/users/login/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: username, password: password }),
            });

            if (response.status === 200) {
                alert("Login successful!");
                setTimeout(() => {
                    window.open("/", "_self");
                }, 1);
            } else {
                alert("Login failed. " + (await response.text()));
                setTimeout(() => {
                    window.open("login.html", "_self");
                }, 1);
            }
        } catch (error) {
            console.error("Error during login: ", error);
            alert("Error during login: " + error);
        }
    });
