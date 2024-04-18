import BASE_URL from "../config.js";

const userList = document.getElementById("users");
const popup = document.querySelector(".popup");
const popupName = document.getElementById("popup-name");
const popupAccept = document.getElementById("popup-accept");

function addUser(user, currentUser) {
    const li = document.createElement("li");
    li.classList.add("user");

    const nameElement = document.createElement("h");
    nameElement.innerHTML = `Username: <b>${user.name}</b>`;
    li.appendChild(nameElement);

    if (user.name !== currentUser) {
        const optionsElement = document.createElement("div");

        const selectElement = document.createElement("select");
        selectElement.classList.add("option");
        selectElement.onchange = async (event) => {
            const response = await fetch(`${BASE_URL}/users/change-status`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: user.name, status: event.target.value})
            })

            if (response.status !== 200) {
                alert(await response.text());
            }

            location.reload();
        };

        for (const status of Object.values(USER_STATUS)) {
            const option = document.createElement("option");
            option.innerText = status;
            if (user.status === status) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        }

        optionsElement.appendChild(selectElement);

        const deleteButton = document.createElement("button");
        deleteButton.classList.add("option", "option-button");
        deleteButton.onclick = () => {
            popupName.innerText = user.name;
            popup.classList.add("popup-show");
        };
        deleteButton.innerHTML = "<i class='fa fa-trash'></i>";
        optionsElement.appendChild(deleteButton);

        li.appendChild(optionsElement);
    } else {
        const youElement = document.createElement("i");
        youElement.innerText = "You";
        li.appendChild(youElement);
    }

    userList.appendChild(li);
}

async function deleteUser() {
    popup.classList.remove("popup-show");
    const response = await fetch(`${BASE_URL}/users/delete`, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: popupName.textContent })
    });

    if (response.status !== 200) {
        alert(await response.text());
    }

    location.reload();
}

document.addEventListener("keydown", async (event) => {
    if (event.key === "Escape") {
        popup.classList.remove("popup-show");
    } else if (event.key === "Enter" && popup.classList.contains("popup-show")) {
        deleteUser();
    }
});

popupAccept.onclick = deleteUser;



fetch(`${BASE_URL}/users`, {
    credentials: "include"
})
    .then(async (response) => {
        if (response.status !== 200) {
            alert(await response.text());
            window.open("dashboard.html", "_self");
            return;
        }
        
        const json = await response.json();

        for (const user of json.users) {
            addUser(user, json.name);
        }
    })
    .catch((err) => {
        alert(err);
    });
