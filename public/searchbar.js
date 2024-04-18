import { checkLoginStatus, logout } from "./auth/loginStatus.js";
import BASE_URL from "./config.js";

const actions = {
    google: (text) => {
        window.open(
            "https://google.com/search?q=" + text.replace(" ", "+"),
            "_blank"
        );
    },
    openUrl: (url) => {
        window.open(url, "_blank");
    },
    clipboard: (text) => {
        navigator.clipboard.writeText(text).catch((err) => {
            console.error("Error copying to clipboard:", err);
        });
    },
    changeInput: (text) => {
        searchInput.value = text;
        const inputEvent = new Event("input");
        searchInput.dispatchEvent(inputEvent);
    },
    scrollToElement: (id) => {
        const element = document.getElementById(id);
        const headerOffset = 70;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
        });
    },
};

const keywords = {
    calc: {
        description:
            "Calculates a given mathematical expression or converts units",
        run: (args) => {
            const icon = "icons/calculator.svg";
            try {
                const result = math.evaluate(args);
                createSuggestion(
                    result,
                    'Result of calculating "' +
                        args +
                        '", click to copy to clipboard',
                    "clipboard",
                    result,
                    icon
                );
            } catch (error) {
                createSuggestion(
                    "Please input a valid expression to calculate",
                    "This could be a mathematical term or a unit conversion",
                    null,
                    null,
                    icon
                );
            }
        },
    },
    weather: {
        description: "Displays the weather at a given or your current location",
        run: (args) => {
            computeWeather(args);
        },
    },
    spigot: {
        description:
            "Googles the given keywords only in the scope of spigotmc.org",
        run: (args) => {
            createSuggestion(
                'Search for "' + args + '" inside of spigotmc.org',
                "Click to open",
                "google",
                args + "+site:www.spigotmc.org",
                "https://www.google.com/s2/favicons?domain=www.spigotmc.org"
            );
        },
    },
    conv: {
        description: "Converts a given amount of one currency into another",
        run: (args) => {
            computeCurrency(args);
        },
    },
    about: {
        description: "Go to the about-section of this page",
        run: () => {
            createSuggestion(
                "About me",
                "Click to go to the about-section of this page",
                "scrollToElement",
                "content",
                "icons/about.svg"
            );
        },
    },
    linktree: {
        description: "Check out my most important links",
        run: (args) => {
            computeLinktree(args);
        },
    },
    stack: {
        description: "Search for the given keywords on StackOverflow",
        run: (args) => {
            createSuggestion(
                'Search for "' + args + '" in StackOverflow.',
                "Click to open",
                "openUrl",
                "https://stackoverflow.com/search?q=" + args,
                "https://www.google.com/s2/favicons?domain=www.stackoverflow.com"
            );
        },
    },
    open: {
        description: "Opens the selected project",
        run: (args) => {
            computeOpen(args);
        },
    },
};

const linktree = {
    github: {
        name: "GitHub (CricHammel)",
        isLink: true,
        value: "https://github.com/CricHammel",
    },
    spigotmc: {
        name: "SpigotMC (Cric_Hammel)",
        isLink: true,
        value: "https://www.spigotmc.org/members/cric_hammel.1258286/",
    },
    discord: {
        name: "Discord (Cric_Hammel)",
        isLink: false,
        value: "cric_hammel",
    },
    minecraft: {
        name: "Minecraft (Cric_Hammel)",
        isLink: true,
        value: "https://de.namemc.com/profile/Cric_Hammel.1",
    },
    email: {
        name: "Email (cric_hammel@gmx.de)",
        isLink: false,
        value: "cric_hammel@gmx.de",
    },
    instagram: {
        name: "Instagram (@matte0_mueller)",
        isLink: true,
        value: "https://www.instagram.com/matte0_mueller/",
    },
    twitch: {
        name: "Twitch (@Cric_Hammel)",
        isLink: true,
        value: "https://www.twitch.tv/cric_hammel",
    },
};

function executeAction(action, args) {
    const actionFunction = actions[action];
    if (actionFunction) {
        actionFunction(args);
    } else {
        console.error("Unknown action:", action);
    }
}

function createSuggestion(title, subtitle, action, actionArgs, iconLink) {
    suggestionsList.style.display = "unset";

    const suggestionItem = document.createElement("li");
    suggestionItem.classList.add("suggestion-item");

    if (iconLink) {
        const iconElement = document.createElement("img");
        iconElement.src = iconLink;
        iconElement.alt = "Icon";
        iconElement.style.width = "24px";
        iconElement.style.position = "absolute";
        suggestionItem.appendChild(iconElement);
    }

    const titleElement = document.createElement("div");
    titleElement.textContent = title;
    titleElement.style.color = "#000";
    titleElement.style.marginLeft = "30px";
    suggestionItem.appendChild(titleElement);

    const subtitleElement = document.createElement("div");
    subtitleElement.textContent = subtitle;
    subtitleElement.style.color = "#666";
    subtitleElement.style.marginLeft = "30px";
    suggestionItem.appendChild(subtitleElement);

    if (action !== null) {
        suggestionItem.addEventListener("click", () => {
            executeAction(action, actionArgs);
        });
    }

    suggestionsList.appendChild(suggestionItem);
}

function deleteSuggestions() {
    suggestionsList.innerHTML = "";
    suggestionsList.style.display = "none";
    selectedSuggestionIndex = -1;
}

function handleInput() {
    modifications++;
    const text = searchInput.value;
    const first = text.split(" ")[0];
    const args = text.replace(first, "").trim();
    deleteSuggestions();

    if (!text) {
        return;
    }

    if (first) {
        for (let keyword in keywords) {
            if (keyword === first) {
                keywords[keyword].run(args);
                return;
            } else if (keyword.startsWith(first) || first === "help") {
                createSuggestion(
                    'Did you mean "' + keyword + '"?',
                    keywords[keyword].description,
                    "changeInput",
                    keyword + " ",
                    "icons/suggestion.svg"
                );
            }
        }
    }

    createSuggestion(
        'Google "' + text.trim() + '"',
        "Click to open",
        "google",
        text,
        "https://www.google.com/s2/favicons?domain=www.google.com"
    );
}

function computeWeather(args) {
    const icon = "icons/weather.svg";
    if (args === null || args.length === 0) {
        createSuggestion(
            "Weather Info",
            'Type in a place or "current" for your current location',
            null,
            null,
            icon
        );
        return;
    }

    const currentModifications = modifications;
    window.setTimeout(function () {
        if (currentModifications !== modifications) {
            return;
        }

        if (args === "current") {
            if (!navigator.geolocation) {
                createSuggestion(
                    "Weather failed",
                    "Geolocation not supported by this browser",
                    null,
                    null,
                    icon
                );
                return;
            }

            navigator.geolocation.getCurrentPosition(function (position) {
                fetchWeather(
                    position.coords.latitude,
                    position.coords.longitude
                );
            });
        } else {
            fetch(BASE_URL + "/fetchGeo?args=" + args)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response not ok");
                    }
                    return response.json();
                })
                .then((data) => {
                    fetchWeather(data[0].lat, data[0].lon);
                })
                .catch((error) => {
                    createSuggestion(
                        "Fetching location failed",
                        error,
                        null,
                        null,
                        icon
                    );
                });
        }
    }, 2000);

    function fetchWeather(lat, lon) {
        fetch(BASE_URL + "/fetchWeather?lat=" + lat + "&lon=" + lon)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response not ok");
                }
                return response.json();
            })
            .then((data) => {
                createSuggestion(
                    'Current weather for "' +
                        data.name +
                        '": ' +
                        data.weather[0].description,
                    "Temperature: " +
                        data.main.temp +
                        "°C. Feels like: " +
                        data.main.feels_like +
                        "°C. Minimum: " +
                        data.main.temp_min +
                        "°C. Maximum: " +
                        data.main.temp_max +
                        "°C. Humidity: " +
                        data.main.humidity +
                        "%. Pressure: " +
                        data.main.pressure +
                        "hPa.",
                    "openUrl",
                    "https://openweathermap.org/city/" + data.id,
                    icon
                );
            })
            .catch((error) => {
                createSuggestion("Weather failed", error, null, null, icon);
            });
    }
}

function computeCurrency(args) {
    const icon = "icons/currency.svg";
    if (args === null || args.length === 0) {
        createSuggestion(
            "Currency Conversion",
            "Type in an amount, followed by the corresponding currency and the currency it should be converted to",
            null,
            null,
            icon
        );
        return;
    }

    const regex = /[0-9]+ [A-Za-z]+ [A-Za-z]+/;
    const matches = args.match(regex);

    if (!matches) {
        createSuggestion(
            "Currency Convsersion failed",
            'Invalid input "' + args + '"',
            null,
            null,
            icon
        );
        return;
    }

    const pieces = args.split(" ");
    const value = parseFloat(pieces[0]);
    const currencyFrom = pieces[1].toUpperCase();
    const currencyTo = pieces[2].toUpperCase();

    if (currencyRates) {
        compareCurrencies(currencyFrom, currencyTo, value);
    } else {
        const currencyUrl = "https://api.exchangerate-api.com/v4/latest/USD";
        fetch(currencyUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response not ok");
                }
                return response.json();
            })
            .then((data) => {
                currencyRates = data.rates;
                compareCurrencies(currencyFrom, currencyTo, value);
            })
            .catch((error) => {
                createSuggestion(
                    "Currency Conversion failed",
                    error,
                    null,
                    null,
                    icon
                );
            });
    }

    function compareCurrencies(currencyFrom, currencyTo, value) {
        try {
            if (!(currencyRates[currencyFrom] && currencyRates[currencyTo])) {
                throw new Error("Invalid currencies");
            }

            const conversionRate =
                currencyRates[currencyTo] / currencyRates[currencyFrom];
            const convertedValue = (value * conversionRate).toFixed(2);
            createSuggestion(
                "Converted result: " + convertedValue + " " + currencyTo,
                "Click to copy to clipboard",
                "clipboard",
                convertedValue,
                icon
            );
        } catch (error) {
            createSuggestion(
                "Currency Conversion failed",
                error,
                null,
                null,
                icon
            );
        }
    }
}

function computeLinktree(args) {
    const icon = "icons/linktree.svg";
    for (const link in linktree) {
        if (link.startsWith(args.toLowerCase())) {
            const isLink = linktree[link].isLink;
            createSuggestion(
                linktree[link].name,
                isLink ? "Click to open link" : "Click to Copy",
                isLink ? "openUrl" : "clipboard",
                linktree[link].value,
                icon
            );
        }
    }
}

function computeOpen(args) {
    const icon = "icons/open.svg";
    for (const project of projects) {
        if (project.name.toLowerCase().startsWith(args.toLowerCase())) {
            createSuggestion(
                project.name,
                "Click to Open",
                "openUrl",
                project.link,
                icon
            );
        }
    }
}

function handleKeyDown(event) {
    switch (event.key) {
        case "ArrowUp":
            navigateSuggestions(-1);
            break;
        case "ArrowDown":
            navigateSuggestions(1);
            break;
        case "Enter":
            executeSelectedSuggestion();
            break;
        case "Escape":
            actions.changeInput("");
        default:
            break;
    }
}

function navigateSuggestions(direction) {
    const suggestionItems = document.querySelectorAll(".suggestion-item");
    selectedSuggestionIndex =
        (selectedSuggestionIndex + direction + suggestionItems.length) %
        suggestionItems.length;
    selectSuggestion();
}

function selectSuggestion() {
    const suggestionItems = document.querySelectorAll(".suggestion-item");

    suggestionItems.forEach((item) => {
        item.classList.remove("selected");
        item.style.backgroundColor = "#fff";
    });

    const selectedSuggestion = suggestionItems[selectedSuggestionIndex];
    selectedSuggestion.classList.add("selected");
    selectedSuggestion.style.backgroundColor = "#f0f0f0";
}

function executeSelectedSuggestion() {
    const suggestionItems = document.querySelectorAll(".suggestion-item");

    if (
        selectedSuggestionIndex >= 0 &&
        selectedSuggestionIndex < suggestionItems.length
    ) {
        const selectedSuggestion = suggestionItems[selectedSuggestionIndex];
        selectedSuggestion.style.backgroundColor = "#e0e0e0";
        window.setTimeout(function () {
            selectedSuggestion.style.backgroundColor = "#f0f0f0";
        }, 150);
        const clickEvent = new Event("click");
        selectedSuggestion.dispatchEvent(clickEvent);
    } else if (selectedSuggestionIndex === -1 && suggestionItems.length >= 1) {
        const selectedSuggestion = suggestionItems[0];
        selectedSuggestion.style.backgroundColor = "#e0e0e0";
        window.setTimeout(function () {
            selectedSuggestion.style.backgroundColor = "#fff";
        }, 150);
        const clickEvent = new Event("click");
        selectedSuggestion.dispatchEvent(clickEvent);
    }
}

const searchInput = document.getElementById("search-input");
const suggestionsList = document.getElementById("suggestions");
let currencyRates;
let selectedSuggestionIndex = -1;
let modifications = 0;
let projects = [];

fetch("./projects.json")
    .then((response) => response.json())
    .then((json) => (projects = json.projects));

searchInput.addEventListener("input", handleInput);
searchInput.addEventListener("keydown", handleKeyDown);

const info = document.getElementById("userInfo");
const authButton = document.getElementById("authButton");
const dashboardButton = document.getElementById("dashboardButton");

checkLoginStatus()
    .then((json) => {
        if (json.loggedIn) {
            info.innerHTML = `Logged in as <a href="auth/profile.html">${json.username}</a>`;
            authButton.innerText = "Log out";
            authButton.onclick = () => logout();
            if (json.status === USER_STATUS.ADMIN) {
                dashboardButton.style.display = "unset";
            }
        } else {
            info.innerText = "Not logged in";
            authButton.innerText = "Log in";
            authButton.onclick = () => window.open("auth/login.html", "_self");
        }
    })
    .catch((error) => {
        info.innerText = "Error checking login status: " + error;
        authButton.style.display = "None";
    });
