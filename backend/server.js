const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const crypto = require("crypto");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

let shuttingDown = false;

app.use((req, res, next) => {
    if (!shuttingDown) {
        return next();
    }

    throw new Error("Server is closing");
});

const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.DB_NAME
});

app.use(
    session({
        name: "app.sid",
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {secure: false, sameSite: "strict"},
        store: sessionStore
    })
);
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(cors({credentials: true, origin: "http://localhost:3000"}));
app.use("/users", authRoutes);
app.use("/chats", chatRoutes);

app.get("/fetchGeo", async (req, res) => {
    const geoUrl =
                "http://api.openweathermap.org/geo/1.0/direct?q=" +
                req.query.args +
                "&limit=1&appid=" +
                process.env.OPEN_WEATHER_API_KEY;
    
    fetch(geoUrl).then(async (response) => {
        if (!response.ok) {
            throw new Error("Network response not ok");
        }
        res.json(await response.json());
    })
});

app.get("/fetchWeather", async (req, res) => {
    const weatherUrl =
        "https://api.openweathermap.org/data/2.5/weather?lat=" +
        req.query.lat +
        "&lon=" +
        req.query.lon +
        "&units=metric&appid=" +
        process.env.OPEN_WEATHER_API_KEY;

    fetch(weatherUrl).then(async (response) => {
        if (!response.ok) {
            throw new Error("Network response not ok");
        }
        res.json(await response.json());
    })
});

function shutdown() {
    console.log("Stopping server...");
    shuttingDown = true;
    setTimeout(() => process.exit(0), 2000);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});