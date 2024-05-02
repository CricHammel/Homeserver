const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const router = express.Router();
const { USER_STATUS } = require("../../public/userStatus");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  // database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await connection.changeUser({ database: process.env.DB_NAME });
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        status VARCHAR(255)
      )
      `);
    connection.release();
  } catch (error) {
    console.log("Something went wrong: " + error.message);
    console.log(error);
  }
})();

router.get("/", async (req, res) => {
  const sessionUser = req.session.user;

  if (sessionUser && sessionUser.status === USER_STATUS.ADMIN) {
    try {
      const [users] = await pool.query("SELECT * FROM Users");
      res.json({ users, name: sessionUser.name });
    } catch (error) {
      res.status(500).send(error.message);
    }
  } else {
    res
      .status(401)
      .send("You must be an admin user to access this information");
  }
});

router.get("/find-by-id", async (req, res) => {
  try {
    res.json(await getUserById(req.query.id));
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/register", async (req, res) => {
  const existingUser = await getUserByName(req.body.name);

  if (existingUser) {
    return res.status(400).send("User already exists");
  }

  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const users = await pool.query("SELECT * FROM Users");
    await createUser(req.body.name, hashedPassword, !users[0][0] || !users[0][0].id ? USER_STATUS.ADMIN : USER_STATUS.NORMAL);
    res.status(201).send("Added user");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/login", async (req, res) => {
  const user = await getUserByName(req.body.name);

  if (!user) {
    return res.status(400).send("User does not exist");
  }

  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      req.session.user = user;
      res.status(200).send("Logged in");
    } else {
      res.status(401).send("Wrong Password");
    }
  } catch (error) {
    res.status(500).send(error.message);
    console.log(error.message);
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).send("Logout failed");
    } else {
      res.status(200).send("Logout successful");
    }
  });
});

router.put("/change-username", async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    res.status(401).send("Not logged in");
    return;
  }

  const newName = req.body.newName;
  const existingUser = await getUserByName(newName);
  if (existingUser) {
    res.status(400).send("Username already exists");
    return;
  }

  try {
    await updateUserName(sessionUser._id, newName)
    sessionUser.name = newName;
    req.session.user = sessionUser;
    res.status(201).send("Change username successful");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.put("/change-password", async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    res.status(401).send("Not logged in");
    return;
  }

  const password = req.body.password;
  const newPassword = req.body.newPassword;
  try {
    if (!(await bcrypt.compare(password, sessionUser.password))) {
      res.status(401).send("Wrong password");
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(sessionUser.id, hashedPassword);
    sessionUser.password = hashedPassword;
    req.session.user = sessionUser;
    res.status(201).send("Change password successful");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.put("/change-status", async (req, res) => {
  const sessionUser = req.session.user;

  if (sessionUser && sessionUser.status === USER_STATUS.ADMIN) {
    const status = req.body.status;

    if (!Object.values(USER_STATUS).includes(status)) {
      res.status(400).send("Invalid status");
      return;
    }

    const user = await getUserByName(req.body.name);
    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    try {
      await updateUserStatus(user.id, status);
      res.status(200).send("Changed user status successfully");
    } catch (error) {
      res.status(500).send(error.message);
    }
  } else {
    res.status(401).send("You must be an admin user to perform this operation");
  }
});

router.delete("/delete", async (req, res) => {
  const sessionUser = req.session.user;

  if (sessionUser && sessionUser.status === USER_STATUS.ADMIN) {
    const user = await getUserByName(req.body.name);

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    try {
      await deleteUser(user.id);
      res.status(200).send("User deleted successfully");
    } catch (error) {
      res.status(500).send(error.message);
    }
  } else {
    res.status(401).send("You must be an admin user to perform this operation");
  }
});

router.get("/status", (req, res) => {
  if (req.session.user) {
    res
      .status(200)
      .json({
        loggedIn: true,
        username: req.session.user.name,
        status: req.session.user.status,
      });
  } else {
    res.status(200).json({ loggedIn: false });
  }
});

async function getUserByName(name) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT * FROM Users WHERE name = ?", [name]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.log("Something went wrong: " + error);
    return null;
  }
}

async function getUserById(id) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT * FROM Users WHERE id = ?", [id]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.log("Something went wrong: " + error);
    return null;
  }
}

async function createUser(name, password, status) {
  try {
    const connection = await pool.getConnection();
    await connection.query("INSERT INTO Users (name, password, status) VALUES (?, ?, ?)", [name, password, status]);
    connection.release();
  } catch (error) {
    console.log("Something went wrong: " + error);
    return null;
  }
}

async function updateUserName(id, name) {
  try {
    const connection = await pool.getConnection();
    await connection.query("UPDATE Users SET name = ? WHERE id = ?", [name, id]);
    connection.release();
  } catch (error) {
    console.log("Something went wrong: " + error);
    return null;
  }
}

async function updateUserPassword(id, password) {
  try {
    const connection = await pool.getConnection();
    await connection.query("UPDATE Users SET password = ? WHERE id = ?", [password, id]);
    connection.release();
  } catch (error) {
    console.log("Something went wrong: " + error);
    return null;
  }
}

async function deleteUser(id) {
  try {
    const connection = await pool.getConnection();
    await connection.query("DELETE FROM Users WHERE id = ?", [id]);
    connection.release();
  } catch (error) {
    console.log("Something went wrong: " + error);
    return null;
  }
}

module.exports = router;
