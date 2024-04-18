const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Users } = require("./authRoutes");

const chatsSchema = new mongoose.Schema({
  userOne: String,
  userTwo: String,
  messages: [
    {
      type: { type: String },
      timestamp: { type: Number },
      fromUserOne: { type: Boolean },
      content: { type: String },
    },
  ],
});

const Chats = mongoose.model("Chats", chatsSchema);

router.use((req, res, next) => {
  const user = req.session.user;

  if (!user) {
    return res.status(401).send("Not logged in");
  }

  next();
});

router.get("/", async (req, res) => {
  try {
    res.json(await Chats.find());
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/loadChats", async (req, res) => {
  const user = req.session.user;

  const chats = await Chats.find({
    $or: [{ userOne: user._id }, { userTwo: user._id }],
  });

  res.status(200).json(chats);
});

router.post("/loadChat", async (req, res) => {
  const user = req.session.user;

  const partnerName = req.body.partner;
  const partner = await Users.findOne({ name: partnerName });

  if (!partner) {
    res.status(400).send("Partner not found");
    return;
  }

  let chat = await Chats.findOne({
    $or: [
      { userOne: user._id, userTwo: partner._id },
      { userOne: partner._id, userTwo: user._id },
    ],
  });

  if (!chat) {
    chat = new Chats({ userOne: user._id, userTwo: partner._id, messages: [] });
  }

  res.status(200).json(chat);
});

router.post("/postMessage", async (req, res) => {
  const user = req.session.user;

  const partnerName = req.body.partner;
  const partner = await Users.findOne({ name: partnerName });

  if (!partner) {
    res.status(400).send("Partner not found");
    return;
  }

  let chat = await Chats.findOne({
    $or: [
      { userOne: user._id, userTwo: partner._id },
      { userOne: partner._id, userTwo: user._id },
    ],
  });

  if (!chat) {
    chat = new Chats({ userOne: user._id, userTwo: partner._id, messages: [] });
  }

  chat.messages.push({
    type: "text",
    timestamp: Date.now(),
    fromUserOne: user._id === chat.userOne,
    content: req.body.content,
  });

  await chat.save();

  res.status(200).json(chat);
});

router.post("/removeMessage", async (req, res) => {
  const user = req.session.user;

  if (!user) {
    res.status(401).send("Not logged in");
    return;
  }

  const partnerName = req.body.partner;
  const partner = await Users.findOne({ name: partnerName });

  if (!partner) {
    res.status(400).send("Partner not found");
    return;
  }

  const chat = await Chats.findOne({
    $or: [
      { userOne: user._id, userTwo: partner._id },
      { userOne: partner._id, userTwo: user._id },
    ],
  });

  if (!chat) {
    res.status(500).send("Chat does not exist");
    return;
  }

  chat.messages.forEach((message, index, array) => {
    if (message.timestamp === req.body.timestamp) {
      array.splice(index, 1);
    }
  });

  await chat.save();

  res.status(200).json(chat);
});

module.exports = router;
