const express = require("express");
const cors = require("cors");
const session = require("express-session");
const crypto = require("crypto");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const path = require("path");
const {router: authRoutes } = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const mongoUrl = "mongodb://localhost:27017/raspi";
mongoose.connect(mongoUrl).catch(error => {
    console.log(error);
});

mongoose.connection.on("error", error => {
    console.log(error);
});

app.use(
    session({
        name: "app.sid",
        secret: crypto.randomBytes(32).toString("hex"),
        resave: false,
        saveUninitialized: false,
        cookie: {secure: false, sameSite: "strict"},
        store: MongoStore.create({mongoUrl: mongoUrl})
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

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});