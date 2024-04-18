import BASE_URL from "../config.js";

const loggedIn = false;

export async function checkLoginStatus() {
    const response = await fetch(`${BASE_URL}/users/status`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return await response.json();
}

export async function logout() {
    try {
        const response = await fetch(`${BASE_URL}/users/logout`, {
            method: "POST",
            credentials: "include",
        });
        if (response.status === 200) {
            location.reload();
        } else {
            console.error("Logout failed");
        }
    } catch (error) {
        console.error("Error during logout:", error);
    }
}

export function isLoggedIn() {
    return loggedIn;
}
