import BASE_URL from "../../config.js";

document
    .getElementById("registerForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${BASE_URL}/users/register/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: username,
                    password: password,
                }),
            });

            if (response.status === 201) {
                alert("Registration successful! You can now log in.");
                setTimeout(() => {
                    window.open("login.html", "_self");
                }, 1);
            } else {
                alert("Registration failed. " + (await response.text()));
                setTimeout(() => {
                    window.open("register.html", "_self");
                }, 1);
            }
        } catch (error) {
            console.error("Error during registration:", error);
        }
    });
