const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN in .env");
  }
  return token;
}

function apiBase() {
  return `https://api.telegram.org/bot${getBotToken()}`;
}

function fileBase() {
  return `https://api.telegram.org/file/bot${getBotToken()}`;
}

async function telegramRequest(method, params = {}, { useGet = false } = {}) {
  const base = apiBase();
  let response;

  if (useGet) {
    const url = new URL(`${base}/${method}`);
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
    response = await fetch(url, { method: "GET" });
  } else {
    response = await fetch(`${base}/${method}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    });
  }

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(
      `Telegram API error (${method}): ${JSON.stringify(data)}`
    );
  }
  return data.result;
}

async function sendMessage(chatId, text) {
  return telegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true
  });
}

async function sendChatAction(chatId, action = "typing") {
  return telegramRequest("sendChatAction", {
    chat_id: chatId,
    action
  });
}

async function getUpdates({ offset, timeout = 25 } = {}) {
  return telegramRequest(
    "getUpdates",
    {
      offset,
      timeout,
      allowed_updates: JSON.stringify(["message"])
    },
    { useGet: true }
  );
}

async function getFile(fileId) {
  return telegramRequest("getFile", { file_id: fileId });
}

async function downloadFile(filePath, outputPath) {
  const url = `${fileBase()}/${String(filePath || "").replace(/^\/+/, "")}`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Telegram file download error (${response.status}): ${body || "sin detalle"}`
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (!outputPath) return bytes;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, bytes);
  return outputPath;
}

module.exports = {
  sendMessage,
  sendChatAction,
  getUpdates,
  getFile,
  downloadFile,
  telegramRequest
};
