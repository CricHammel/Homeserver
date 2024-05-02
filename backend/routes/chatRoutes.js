const express = require("express");
const mysql = require("mysql2/promise");
const router = express.Router();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userOne INT NOT NULL,
        userTwo INT NOT NULL,
        messages JSON NOT NULL,
        FOREIGN KEY (userOne) REFERENCES Users(id),
        FOREIGN KEY (userTwo) REFERENCES Users(id)
      )
    `);
  } catch (error) {
    console.log("Something went wrong: " + error);
    console.log(error);
  }
})();

router.use((req, res, next) => {
  const user = req.session.user;

  if (!user) {
    return res.status(401).send("Not logged in");
  }

  next();
});

router.get("/", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [chats] = await connection.query("SELECT * FROM Chats");
    connection.release();
    res.json(chats);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/loadChats", async (req, res) => {
  const user = req.session.user;

  if (!user) {
    res.status(401).send("Not logged in");
    return;
  }

  try {
    const connection = await pool.getConnection();
    const [chats] = await connection.query("SELECT * FROM Chats WHERE userOne = ? OR userTwo = ?", [user.id, user.id]);
    connection.release();
  
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/loadChat", async (req, res) => {
  const user = req.session.user;

  if (!user) {
    res.status(401).send("Not logged in");
    return;
  }

  const partnerName = req.body.partner;
  const [partnerRows] = await pool.query("SELECT * FROM Users WHERE name = ?", [partnerName]);

  if (partnerRows.length === 0) {
    res.status(404).send("Partner not found");
    return;
  }

  const partner = partnerRows[0];
  let chat;

  try {
    const connection = await pool.getConnection();
    const [chatRows] = await connection.query("SELECT * FROM Chats WHERE (userOne = ? AND userTwo = ?) OR (userOne = ? AND userTwo = ?)", [user.id, partner.id, partner.id, user.id]);
    connection.release();

    if (chatRows.length === 0) {
      chat = {
        userOne: user.id,
        userTwo: partner.id,
        messages: []
      };
    } else {
      chat = chatRows[0];
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/postMessage", async (req, res) => {
  const user = req.session.user;

  if (!user) {
    res.status(401).send("Not logged in");
    return;
  }

  const partnerName = req.body.partner;
  const [partnerRows] = await pool.query("SELECT * FROM Users WHERE name = ?", [partnerName]);

  if (partnerRows.length === 0) {
    res.status(404).send("Partner not found");
    return;
  }

  const partner = partnerRows[0];
  let chat;

  try {
    const connection = await pool.getConnection();
    const [chatRows] = await connection.query("SELECT * FROM Chats WHERE (userOne = ? AND userTwo = ?) OR (userOne = ? AND userTwo = ?)", [user.id, partner.id, partner.id, user.id]);

    if (chatRows.length === 0) {
      chat = {
        userOne: user.id,
        userTwo: partner.id,
        messages: []
      };
    } else {
      chat = chatRows[0];
    }

    chat.messages.push({
      type: "text",
      timestamp: Date.now(),
      fromUserOne: user.id === chat.userOne,
      content: req.body.content
    });

    if (chat.id) {
      await connection.query("UPDATE Chats SET messages = ? WHERE id = ?", [JSON.stringify(chat.messages), chat.id]);
    } else {
      await connection.query("INSERT INTO Chats (userOne, userTwo, messages) VALUES (?, ?, ?)", [chat.userOne, chat.userTwo, JSON.stringify(chat.messages)]);
    }

    connection.release();
    res.status(200).json(chat);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/removeMessage", async (req, res) => {
  const user = req.session.user;

  if (!user) {
    res.status(401).send("Not logged in");
    return;
  }

  const partnerName = req.body.partner;
  const [partnerRows] = await pool.query("SELECT * FROM Users WHERE name = ?", [partnerName]);

  if (partnerRows.length === 0) {
    res.status(404).send("Partner not found");
    return;
  }

  const partner = partnerRows[0];

  try {
    const connection = await pool.getConnection();
    const [chatRows] = await connection.query("SELECT * FROM Chats WHERE (userOne = ? AND userTwo = ?) OR (userOne = ? AND userTwo = ?)", [user.id, partner.id, partner.id, user.id]);

    if (chatRows.length === 0) {
      res.status(500).send("Chat does not exist");
      return;
    }

    chat = chatRows[0];

    chat.messages = chat.messages.filter(message => message.timestamp !== req.body.timestamp);

    await connection.query("UPDATE Chats SET messages = ? WHERE id = ?", [JSON.stringify(chat.messages), chat.id]);
    connection.release();
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
