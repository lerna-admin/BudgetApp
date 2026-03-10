const path = require("node:path");
const fs = require("node:fs");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const API_BASE_URL =
  process.env.CLICKUP_API_BASE_URL || "https://api.clickup.com/api/v2";

function requireToken() {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) {
    throw new Error(
      "Missing CLICKUP_API_TOKEN in environment (.env or shell export)."
    );
  }
  return token;
}

function appendQuery(searchParams, key, value) {
  if (value === undefined || value === null || value === "") return;
  if (Array.isArray(value)) {
    const mode = process.env.CLICKUP_ARRAY_MODE || "bracket";
    const name = mode === "bracket" ? `${key}[]` : key;
    for (const item of value) searchParams.append(name, String(item));
    return;
  }
  searchParams.set(key, String(value));
}

async function clickupRequest(method, pathName, { query, body } = {}) {
  const token = requireToken();
  const url = new URL(`${API_BASE_URL}${pathName}`);
  const searchParams = url.searchParams;

  if (query && typeof query === "object") {
    for (const [key, value] of Object.entries(query)) {
      appendQuery(searchParams, key, value);
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: token,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const details = data ? JSON.stringify(data) : `HTTP ${response.status}`;
    throw new Error(`ClickUp API error ${response.status}: ${details}`);
  }

  return data;
}

async function clickupUploadAttachment(taskId, filePath, { query } = {}) {
  const token = requireToken();
  const url = new URL(`${API_BASE_URL}/task/${taskId}/attachment`);
  const searchParams = url.searchParams;

  if (query && typeof query === "object") {
    for (const [key, value] of Object.entries(query)) {
      appendQuery(searchParams, key, value);
    }
  }

  const form = new FormData();
  const fileBytes = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  form.append("attachment", new Blob([fileBytes]), filename);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: token
    },
    body: form
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const details = data ? JSON.stringify(data) : `HTTP ${response.status}`;
    throw new Error(`ClickUp attachment error ${response.status}: ${details}`);
  }

  return data;
}

module.exports = {
  clickupRequest,
  clickupUploadAttachment
};
