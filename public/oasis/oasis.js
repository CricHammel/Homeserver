import BASE_URL from "../config.js";
import { checkLoginStatus } from "../auth/loginStatus.js";

let username;
const noChatsElement = document.getElementById("no-chats");
const chatList = document.querySelector(".recent-chats");
const noChatElement = document.getElementById("no-chat");
const currentChatContainer = document.querySelector(".current-chat-container");
const messagesElement = document.querySelector(".messages");
const sendButton = document.querySelector(".send-button");
const input = document.querySelector(".message-input");
const searchbar = document.getElementById("search");
const newChatButton = document.getElementById("new-chat");
const chatPartner = document.getElementById("chat-partner");

async function loadChats() {
  const response = await fetch(`${BASE_URL}/chats/loadChats`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((data) => data.json())
    .catch((error) => {
      console.log(error);
    });

  if (response.length === 0) {
    noChatsElement.style.display = "inherit";
    return;
  }

  chatList.innerHTML = "";

  response.sort(
    (a, b) =>
      b.messages[b.messages.length - 1].timestamp -
      a.messages[a.messages.length - 1].timestamp,
  );

  for (const chat of response) {
    const userOneName = (
      await fetch(`${BASE_URL}/users/find-by-id?id=${chat.userOne}`).then(
        (data) => data.json(),
      )
    ).name;
    const isUserOne = userOneName === username;
    const partner = isUserOne
      ? (
          await fetch(`${BASE_URL}/users/find-by-id?id=${chat.userTwo}`).then(
            (data) => data.json(),
          )
        ).name
      : userOneName;
    buildChatPreview(chat, isUserOne, partner);
  }

  updateSelected();
}

function buildChatPreview(chat, isUserOne, partner) {
  const li = document.createElement("li");
  li.classList.add("recent-chat");
  li.setAttribute("data-partner", partner);
  li.onclick = async () => {
    await loadChat(partner);
    await loadChats();
  };

  const recentChatFirst = document.createElement("div");
  recentChatFirst.classList.add("recent-chat-first");
  li.appendChild(recentChatFirst);

  const recentChatTitle = document.createElement("b");
  recentChatTitle.classList.add("recent-chat-title");
  recentChatTitle.innerText = partner;
  recentChatFirst.appendChild(recentChatTitle);

  const latestMessage = chat.messages[chat.messages.length - 1];
  const recentChatDate = document.createElement("i");
  recentChatDate.classList.add("recent-chat-date");
  recentChatDate.innerText = formatDate(latestMessage.timestamp);
  recentChatFirst.appendChild(recentChatDate);

  const recentChatSecond = document.createElement("i");
  recentChatSecond.classList.add("recent-chat-second");
  recentChatSecond.innerHTML =
    "<b>" +
    (latestMessage.fromUserOne === isUserOne ? "You: " : partner + ": ") +
    "</b>" +
    latestMessage.content;
  li.appendChild(recentChatSecond);

  chatList.appendChild(li);
}

function formatDate(timestamp) {
  const currentDate = new Date();
  const targetDate = new Date(timestamp);

  const timeDifference = currentDate - targetDate;
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "now";
  } else if (minutes < 60) {
    return minutes + ` ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (hours < 24) {
    return hours + ` ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (days < 4) {
    return days + ` ${days === 1 ? "day" : "days"} ago`;
  } else {
    const formattedDate = targetDate.toLocaleString("en-UK", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return formattedDate;
  }
}

async function loadChat(partner) {
  const response = await fetch(`${BASE_URL}/chats/loadChat`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ partner: partner }),
  })
    .then(async (data) => {
      if (data.status !== 200) {
        alert(await data.text());
        return null;
      }

      return data.json();
    })
    .catch((error) => {
      console.log(error);
    });

  if (Object.keys(response).length === 0) {
    return;
  }

  await buildChat(response, partner);
}

async function buildChat(chat, partner) {
  noChatElement.style.display = "none";

  chatPartner.innerText = partner;
  messagesElement.innerHTML = "";
  currentChatContainer.setAttribute("data-partner", partner);

  const userOneName = (
    await fetch(`${BASE_URL}/users/find-by-id?id=${chat.userOne}`).then(
      (data) => data.json(),
    )
  ).name;
  const isUserOne = userOneName !== partner;

  chat.messages.reverse();

  for (const message of chat.messages) {
    buildMessage(message, isUserOne === message.fromUserOne);
  }

  updateSelected();
  currentChatContainer.style.display = "inherit";
}

function buildMessage(message, own) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.classList.add(own ? "message-right" : "message-left");

  const contentElement = document.createElement("div");
  contentElement.innerText = message.content;
  messageElement.appendChild(contentElement);

  const timeElement = document.createElement("i");
  timeElement.classList.add("message-time");
  timeElement.innerText = formatDateShort(message.timestamp);
  messageElement.appendChild(timeElement);

  messagesElement.appendChild(messageElement);
}

function formatDateShort(timestamp) {
  const currentDate = new Date();
  const targetDate = new Date(timestamp);

  const timeDifference = currentDate - targetDate;
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "now";
  } else if (minutes < 60) {
    return minutes + "m";
  } else if (hours < 24) {
    return hours + "h";
  } else if (days < 4) {
    return days + "d";
  } else {
    const formattedDate = targetDate.toLocaleString("en-UK", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
    return formattedDate;
  }
}

function updateSelected() {
  for (const chat of chatList.children) {
    if (
      chat.getAttribute("data-partner") ===
      currentChatContainer.getAttribute("data-partner")
    ) {
      chat.classList.add("recent-chat-selected");
      continue;
    }

    chat.classList.remove("recent-chat-selected");
  }
}

async function sendMessage() {
  const value = input.value.trim();
  const partner = currentChatContainer.getAttribute("data-partner");

  if (!value) {
    return;
  }

  input.value = "";

  const response = await fetch(`${BASE_URL}/chats/postMessage`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ partner: partner, content: value }),
  })
    .then((data) => data.json())
    .catch((error) => {
      console.log(error);
    });

  await loadChats();
  await buildChat(response, partner);
}

sendButton.addEventListener("click", sendMessage);

input.addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    await sendMessage();
  } else if (event.key === "Escape") {
    input.blur();
  }
});

searchbar.addEventListener("keyup", async (event) => {
  if (event.key === "Enter") {
    await loadChat(searchbar.value);
    searchbar.value = "";
  } else if (event.key === "Escape") {
    searchbar.blur();
    return;
  }

  const term = searchbar.value.toLowerCase();
  const chats = chatList.children;

  for (const chat of chats) {
    if (chat.firstChild.firstChild.innerText.toLowerCase().indexOf(term) > -1) {
      chat.style.display = "";
    } else {
      chat.style.display = "none";
    }
  }
});

newChatButton.addEventListener("click", () => {
  searchbar.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));
});

document.addEventListener("visibilitychange", async () => {
  if (!document.hidden) {
    await loadChats();
    await loadChat(currentChatContainer.getAttribute("data-partner"));
  }
});

(async () => {
  const loginStatus = await checkLoginStatus();
  if (!loginStatus.loggedIn) {
    alert("You need to be logged in to access Oasis!");
    window.open("/", "_self");
  } else {
    username = loginStatus.username;
    await loadChats();
  }
})();
