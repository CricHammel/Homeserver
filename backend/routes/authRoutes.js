const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const router = express.Router();
const { USER_STATUS } = require("../../public/userStatus");

const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  status: String,
});

const Users = mongoose.model("Users", userSchema);

router.get("/", async (req, res) => {
  const sessionUser = req.session.user;

  if (sessionUser && sessionUser.status === USER_STATUS.ADMIN) {
    res.json({ users: await Users.find(), name: sessionUser.name });
  } else {
    res
      .status(401)
      .send("You must be an admin user to access this information");
  }
});

router.get("/find-by-id", async (req, res) => {
  try {
    res.json(await Users.findById(req.query.id));
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/register", async (req, res) => {
  const existingUser = await Users.findOne({ name: req.body.name });

  if (existingUser) {
    return res.status(400).send("User already exists");
  }

  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new Users({
      name: req.body.name,
      password: hashedPassword,
      status:
        (await Users.find()).length !== 0
          ? USER_STATUS.NORMAL
          : USER_STATUS.ADMIN,
    });
    await user.save();
    res.status(201).send("Added user");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/login", async (req, res) => {
  const user = await Users.findOne({ name: req.body.name });
  if (user == null) {
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
  if (sessionUser == null) {
    res.status(401).send("Not logged in");
    return;
  }

  const newName = req.body.newName;
  const existingUser = await Users.findOne({ newName });
  if (existingUser != null) {
    res.status(400).send("Username already exists");
    return;
  }

  const userObject = await Users.findOne(sessionUser);
  userObject.name = newName;
  req.session.user = userObject;
  await userObject.save();
  res.status(201).send("Change username successful");
});

router.put("/change-password", async (req, res) => {
  const sessionUser = req.session.user;
  if (sessionUser == null) {
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

    const userObject = await Users.findOne(sessionUser);
    userObject.password = await bcrypt.hash(newPassword, 10);
    req.session.user = userObject;
    await userObject.save();
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

    const user = await Users.findOne({ name: req.body.name });
    user.status = status;
    await user.save();
    res.status(200).send("Changed user status successfully");
  } else {
    res.status(401).send("You must be an admin user to perform this operation");
  }
});

router.delete("/delete", async (req, res) => {
  const sessionUser = req.session.user;

  if (sessionUser && sessionUser.status === USER_STATUS.ADMIN) {
    await Users.deleteOne({ name: req.body.name });
    res.status(200).send("User deleted successfully");
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

module.exports = {
  router,
  Users,
};
