const fs = require("node:fs");
const { execFile } = require("node:child_process");
const path = require("node:path");
const readline = require("node:readline");
const { promisify } = require("node:util");
const {
  getUpdates,
  sendMessage,
  sendChatAction,
  getFile,
  downloadFile
} = require("./telegram-client");
const { clickupRequest } = require("./clickup-client");
const { getStorageRoot, getMemoryLogPath } = require("./storage-paths");
const {
  getLocalCodexConfig,
  isLocalCodexEnabled,
  runLocalCodexPlanner
} = require("./codex-local-client");

const execFileAsync = promisify(execFile);

const TASK_TYPE_TO_AGENT = {
  market_research: "market-research",
  competitor_analysis: "market-research",
  product_design: "product-design",
  web_development: "web-dev",
  content_seo: "content-seo",
  ops_automation: "ops-automation",
  qa_review: "qa-review"
};

const PRIORITY_ALIAS_TO_VALUE = {
  urgent: 1,
  urgente: 1,
  critical: 1,
  critica: 1,
  crítico: 1,
  high: 2,
  alta: 2,
  normal: 3,
  media: 3,
  medium: 3,
  low: 4,
  baja: 4
};

let teamMembersCache = {
  fetchedAt: 0,
  members: []
};
let spaceMembersCache = new Map();

function parseBooleanEnv(value, fallback = false) {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function getAudioConfig() {
  const storageRoot = getStorageRoot();
  return {
    enabled: parseBooleanEnv(process.env.TELEGRAM_AUDIO_ENABLED, true),
    maxDurationSeconds: parsePositiveInt(
      process.env.TELEGRAM_AUDIO_MAX_SECONDS,
      240
    ),
    maxTranscriptChars: parsePositiveInt(
      process.env.TELEGRAM_AUDIO_MAX_TRANSCRIPT_CHARS,
      4000
    ),
    language: String(process.env.TELEGRAM_STT_LANGUAGE || "es").trim() || "es",
    threads: parsePositiveInt(process.env.TELEGRAM_STT_THREADS, 4),
    whisperBin:
      process.env.TELEGRAM_STT_WHISPER_BIN ||
      path.join(storageRoot, "tools", "whisper.cpp", "build", "bin", "whisper-cli"),
    whisperModel:
      process.env.TELEGRAM_STT_WHISPER_MODEL ||
      path.join(storageRoot, "tools", "whisper.cpp", "models", "ggml-tiny.bin"),
    tmpDir:
      process.env.TELEGRAM_AUDIO_TMP_DIR ||
      path.join(storageRoot, "bot", "tmp-audio")
  };
}

function getAudioAttachment(msg) {
  if (msg?.voice?.file_id) {
    return {
      kind: "voice",
      fileId: msg.voice.file_id,
      duration: Number(msg.voice.duration || 0),
      mimeType: msg.voice.mime_type || "audio/ogg"
    };
  }
  if (msg?.audio?.file_id) {
    return {
      kind: "audio",
      fileId: msg.audio.file_id,
      duration: Number(msg.audio.duration || 0),
      mimeType: msg.audio.mime_type || "audio/mpeg"
    };
  }
  if (
    msg?.document?.file_id &&
    String(msg.document.mime_type || "")
      .toLowerCase()
      .startsWith("audio/")
  ) {
    return {
      kind: "document-audio",
      fileId: msg.document.file_id,
      duration: 0,
      mimeType: msg.document.mime_type || "audio/*"
    };
  }
  return null;
}

function normalizeTranscript(text, maxChars = 4000) {
  const normalized = String(text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "";
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(1, maxChars - 3)).trim()}...`;
}

async function runExecFileChecked(binary, args, { maxBuffer = 20 * 1024 * 1024 } = {}) {
  try {
    const result = await execFileAsync(binary, args, { maxBuffer });
    return {
      stdout: String(result.stdout || ""),
      stderr: String(result.stderr || "")
    };
  } catch (error) {
    const stderr = String(error.stderr || "").trim();
    const stdout = String(error.stdout || "").trim();
    const details = stderr || stdout || error.message || "sin detalle";
    throw new Error(`Fallo ejecutando ${binary}: ${details}`);
  }
}

async function transcribeAudioMessage(msg) {
  const attachment = getAudioAttachment(msg);
  if (!attachment) return null;

  const cfg = getAudioConfig();
  if (!cfg.enabled) {
    throw new Error("Audio recibido, pero TELEGRAM_AUDIO_ENABLED=0.");
  }
  if (attachment.duration && attachment.duration > cfg.maxDurationSeconds) {
    throw new Error(
      `Audio demasiado largo (${attachment.duration}s). Maximo permitido: ${cfg.maxDurationSeconds}s.`
    );
  }

  if (!fs.existsSync(cfg.whisperBin)) {
    throw new Error(`No existe TELEGRAM_STT_WHISPER_BIN: ${cfg.whisperBin}`);
  }
  if (!fs.existsSync(cfg.whisperModel)) {
    throw new Error(`No existe TELEGRAM_STT_WHISPER_MODEL: ${cfg.whisperModel}`);
  }

  fs.mkdirSync(cfg.tmpDir, { recursive: true });
  const tmpPrefix = path.join(cfg.tmpDir, "tg-audio-");
  const tmpDir = fs.mkdtempSync(tmpPrefix);

  try {
    const remote = await getFile(attachment.fileId);
    const remotePath = String(remote?.file_path || "");
    if (!remotePath) {
      throw new Error("No se pudo obtener file_path desde Telegram.");
    }

    const ext = path.extname(remotePath) || ".bin";
    const inputPath = path.join(tmpDir, `input${ext}`);
    const wavPath = path.join(tmpDir, "input.wav");

    await downloadFile(remotePath, inputPath);
    await runExecFileChecked("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-ac",
      "1",
      "-ar",
      "16000",
      wavPath
    ]);

    const whisper = await runExecFileChecked(cfg.whisperBin, [
      "-m",
      cfg.whisperModel,
      "-f",
      wavPath,
      "-l",
      cfg.language,
      "-t",
      String(cfg.threads),
      "-nt",
      "-np"
    ]);

    const text = normalizeTranscript(whisper.stdout, cfg.maxTranscriptChars);
    if (!text) {
      throw new Error(
        "No pude transcribir el audio. Intenta hablar mas claro o enviar un audio mas corto."
      );
    }

    return {
      text,
      attachment
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function parseAllowedUsersFromEnv() {
  const raw = process.env.TELEGRAM_ALLOWED_USER_IDS || "";
  return new Set(
    raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .filter((x) => x !== "replace_me")
  );
}

function botStateFile() {
  const root = getStorageRoot();
  const dir = path.join(root, "bot");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "telegram-offset.json");
}

function loadOffset() {
  const file = botStateFile();
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return Number(data.offset || 0);
  } catch {
    return null;
  }
}

function saveOffset(offset) {
  fs.writeFileSync(
    botStateFile(),
    JSON.stringify({ offset, updated_at: new Date().toISOString() }, null, 2),
    "utf8"
  );
}

function allowlistStateFile() {
  const root = getStorageRoot();
  const dir = path.join(root, "bot");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "telegram-allowlist.json");
}

function loadAllowlistFromDisk() {
  const file = allowlistStateFile();
  if (!fs.existsSync(file)) return new Set();
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(data.user_ids)) return new Set();
    return new Set(data.user_ids.map((x) => String(x).trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function saveAllowlistToDisk(allowedUsers) {
  fs.writeFileSync(
    allowlistStateFile(),
    JSON.stringify(
      {
        user_ids: [...allowedUsers],
        updated_at: new Date().toISOString()
      },
      null,
      2
    ),
    "utf8"
  );
}

function parseBootstrapMaxUsers() {
  const raw = String(process.env.TELEGRAM_BOOTSTRAP_MAX_USERS || "0").trim();
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}

function buildAllowedUsers() {
  const envAllowed = parseAllowedUsersFromEnv();
  const diskAllowed = loadAllowlistFromDisk();
  const merged = new Set([...envAllowed, ...diskAllowed]);
  if (merged.size > 0) {
    saveAllowlistToDisk(merged);
  }
  return merged;
}

function normalizeHumanText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parsePriority(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.floor(value);
    if (n >= 1 && n <= 4) return n;
  }

  const normalized = normalizeHumanText(value);
  if (!normalized) return null;
  if (normalized === "none" || normalized === "sin prioridad") return null;
  if (PRIORITY_ALIAS_TO_VALUE[normalized]) return PRIORITY_ALIAS_TO_VALUE[normalized];

  const parsed = Number(normalized);
  if (Number.isFinite(parsed)) {
    const n = Math.floor(parsed);
    if (n >= 1 && n <= 4) return n;
  }
  throw new Error(
    "Prioridad invalida. Usa urgent/high/normal/low o 1..4."
  );
}

function parseTelegramToClickupUserMap() {
  const raw = process.env.TELEGRAM_TO_CLICKUP_USER_MAP || "";
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const map = {};
    for (const [telegramId, clickupId] of Object.entries(parsed)) {
      if (!telegramId || clickupId === null || clickupId === undefined) continue;
      map[String(telegramId).trim()] = String(clickupId).trim();
    }
    return map;
  } catch {
    return {};
  }
}

async function listTeamMembersCached() {
  const now = Date.now();
  if (
    Array.isArray(teamMembersCache.members) &&
    teamMembersCache.members.length > 0 &&
    now - teamMembersCache.fetchedAt < 10 * 60 * 1000
  ) {
    return teamMembersCache.members;
  }

  const teamId = process.env.CLICKUP_TEAM_ID;
  if (!teamId || teamId === "replace_me") {
    throw new Error("CLICKUP_TEAM_ID is not configured.");
  }

  const response = await clickupRequest("GET", `/team/${teamId}`);
  const rawMembers = Array.isArray(response?.team?.members)
    ? response.team.members
    : [];

  const members = rawMembers
    .map((item) => item?.user)
    .filter(Boolean)
    .map((user) => ({
      id: String(user.id),
      username: user.username || "",
      email: user.email || "",
      initials: user.initials || ""
    }));

  teamMembersCache = {
    fetchedAt: now,
    members
  };
  return members;
}

async function listSpaceMembersCached(spaceId) {
  const normalizedSpaceId = String(spaceId || "").trim();
  if (!normalizedSpaceId) return [];

  const now = Date.now();
  const cached = spaceMembersCache.get(normalizedSpaceId);
  if (
    cached &&
    Array.isArray(cached.members) &&
    cached.members.length > 0 &&
    now - cached.fetchedAt < 10 * 60 * 1000
  ) {
    return cached.members;
  }

  const response = await clickupRequest("GET", `/space/${normalizedSpaceId}`);
  const rawMembers = Array.isArray(response?.members) ? response.members : [];
  const members = rawMembers
    .map((item) => item?.user || item)
    .filter(Boolean)
    .map((user) => ({
      id: String(user.id),
      username: user.username || "",
      email: user.email || "",
      initials: user.initials || ""
    }));

  spaceMembersCache.set(normalizedSpaceId, {
    fetchedAt: now,
    members
  });
  return members;
}

function ensureTaskInScope(task) {
  const wantedListId = String(process.env.CLICKUP_LIST_ID || "").trim();
  const wantedSpaceId = String(process.env.CLICKUP_SPACE_ID || "").trim();
  const taskListId = String(task?.list?.id || "").trim();
  const taskSpaceId = String(task?.space?.id || "").trim();

  if (wantedListId && taskListId && taskListId !== wantedListId) {
    throw new Error(
      `Task fuera de alcance. list_id=${taskListId}, esperado=${wantedListId}`
    );
  }
  if (wantedSpaceId && taskSpaceId && taskSpaceId !== wantedSpaceId) {
    throw new Error(
      `Task fuera del espacio BudgetApp. space_id=${taskSpaceId}, esperado=${wantedSpaceId}`
    );
  }
}

async function getScopedTask(taskId) {
  const task = await clickupRequest("GET", `/task/${taskId}`);
  ensureTaskInScope(task);
  return task;
}

async function resolveAssigneeId({
  assigneeId,
  assigneeName,
  assignToRequester,
  requester,
  scopedTask
}) {
  const scopedMembers = await listSpaceMembersCached(scopedTask?.space?.id);
  const candidateMembers =
    scopedMembers.length > 0 ? scopedMembers : await listTeamMembersCached();

  if (assigneeId !== null && assigneeId !== undefined && assigneeId !== "") {
    const resolvedId = String(assigneeId).trim();
    if (
      candidateMembers.length > 0 &&
      !candidateMembers.some((member) => member.id === resolvedId)
    ) {
      throw new Error(
        `assignee_id=${resolvedId} no tiene acceso a esta tarea (ITEM_087).`
      );
    }
    return resolvedId;
  }

  const mapping = parseTelegramToClickupUserMap();
  const requesterTelegramId = String(requester?.id || "").trim();
  if (assignToRequester && mapping[requesterTelegramId]) {
    const mappedId = mapping[requesterTelegramId];
    if (candidateMembers.some((member) => member.id === mappedId)) {
      return mappedId;
    }
    throw new Error(
      `El mapeo TELEGRAM_TO_CLICKUP_USER_MAP para ${requesterTelegramId} apunta a ${mappedId}, pero no tiene acceso a esta tarea (ITEM_087).`
    );
  }

  if (assignToRequester && requester) {
    const requesterNames = [
      requester.username || "",
      [requester.first_name, requester.last_name].filter(Boolean).join(" ")
    ]
      .map(normalizeHumanText)
      .filter(Boolean);

    if (requesterNames.length > 0) {
      const matched = candidateMembers.find((member) => {
        const memberName = normalizeHumanText(member.username);
        return requesterNames.some(
          (name) => memberName.includes(name) || name.includes(memberName)
        );
      });
      if (matched) return matched.id;
    }
  }

  if (assigneeName) {
    const wanted = normalizeHumanText(assigneeName);
    const matched = candidateMembers.find((member) => {
      const memberName = normalizeHumanText(member.username);
      const memberEmail = normalizeHumanText(member.email);
      return (
        memberName.includes(wanted) ||
        wanted.includes(memberName) ||
        memberEmail.includes(wanted)
      );
    });
    if (matched) return matched.id;
    throw new Error(`No pude resolver assignee_name='${assigneeName}'.`);
  }

  if (assignToRequester) {
    throw new Error(
      "No pude resolver el usuario de ClickUp para el requester actual. Configura TELEGRAM_TO_CLICKUP_USER_MAP."
    );
  }

  return null;
}

function appendMemory({
  ventureId = "budgetapp",
  agentId = "telegram-bot",
  threadId = "telegram-dm",
  eventType = "task_update",
  role = "assistant",
  confidence = 0.95,
  metadata = {},
  content
}) {
  const file = getMemoryLogPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const event = {
    event_id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    created_at: new Date().toISOString(),
    project_id: "budgetapp",
    venture_id: ventureId,
    task_id: null,
    thread_id: threadId,
    agent_id: agentId,
    event_type: eventType,
    role,
    content,
    confidence,
    metadata: { source: "telegram-bot", ...metadata }
  };
  fs.appendFileSync(file, `${JSON.stringify(event)}\n`, "utf8");
}

function splitMessage(text, maxLength = 3900) {
  const raw = String(text || "");
  if (raw.length <= maxLength) return [raw];

  const chunks = [];
  let pending = raw;
  while (pending.length > maxLength) {
    let cut = pending.lastIndexOf("\n", maxLength);
    if (cut < Math.floor(maxLength * 0.5)) {
      cut = maxLength;
    }
    chunks.push(pending.slice(0, cut).trim());
    pending = pending.slice(cut).trimStart();
  }
  if (pending.length > 0) chunks.push(pending);
  return chunks.filter(Boolean);
}

async function sendMessageSafe(chatId, text) {
  const parts = splitMessage(text);
  for (const part of parts) {
    await sendMessage(chatId, part);
  }
}

function shouldSendProcessingAck({ text, hasAudio = false }) {
  if (hasAudio) return true;
  const value = String(text || "").trim();
  if (!value) return false;
  if (value === "/start" || value === "/help" || value === "/ai" || value === "/ai status") {
    return false;
  }
  return true;
}

function normalizeTaskType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function inferTaskType(text) {
  const s = String(text || "").toLowerCase();
  if (/competidor|benchmark|competencia/.test(s)) return "competitor_analysis";
  if (/mercado|investigaci|research/.test(s)) return "market_research";
  if (/diseñ|wireframe|ux|ui|copy/.test(s)) return "product_design";
  if (/bug|fix|frontend|backend|api|codigo|dev|implement/.test(s))
    return "web_development";
  if (/seo|contenido|blog|post|social/.test(s)) return "content_seo";
  if (/automat|n8n|workflow|integraci|cron/.test(s)) return "ops_automation";
  if (/qa|prueba|test|valida/.test(s)) return "qa_review";
  return "ops_automation";
}

function aiStatusText() {
  const cfg = getLocalCodexConfig();
  if (!cfg.enabled) {
    return "AI mode: OFF (TELEGRAM_CODEX_ENABLED=0).";
  }
  return [
    "AI mode: ON (Codex local)",
    `bin=${cfg.bin}`,
    `workdir=${cfg.workdir}`,
    `timeout_ms=${cfg.timeoutMs}`,
    `max_actions=${cfg.maxActions}`
  ].join("\n");
}

function helpText() {
  return [
    "Bot BudgetApp listo.",
    "",
    "Comandos:",
    "/task <task_type> | <titulo> | <descripcion>",
    "/status <task_id>",
    "/ready <task_id>",
    "/comment <task_id> | <comentario>",
    "/ai (estado del modo AI)",
    "/help",
    "",
    "Texto libre:",
    "- Si AI local esta activa, el bot interpreta y ejecuta acciones.",
    "- Si AI no esta disponible, crea tarea automaticamente.",
    "- Tambien puedes enviar un audio por DM: se transcribe localmente y se ejecuta igual que texto."
  ].join("\n");
}

async function createTask({
  from,
  taskType,
  title,
  description,
  source = "telegram-dm"
}) {
  const listId = process.env.CLICKUP_LIST_ID;
  if (!listId || listId === "replace_me") {
    throw new Error("CLICKUP_LIST_ID is not configured.");
  }

  const normalizedTaskType = normalizeTaskType(
    taskType || inferTaskType(description || title)
  );
  if (!TASK_TYPE_TO_AGENT[normalizedTaskType]) {
    throw new Error(`task_type invalido: ${normalizedTaskType}`);
  }

  const safeTitle = String(title || "Nueva solicitud").trim();
  const safeDescription = String(description || "(sin descripcion)").trim();

  const md = [
    `Solicitud via ${source}`,
    "",
    `- requester_id: ${from.id}`,
    `- requester_username: ${from.username || "-"}`,
    `- requester_name: ${[from.first_name, from.last_name].filter(Boolean).join(" ")}`,
    `- task_type: ${normalizedTaskType}`,
    "",
    "## Descripcion",
    safeDescription
  ].join("\n");

  const task = await clickupRequest("POST", `/list/${listId}/task`, {
    body: {
      name: safeTitle,
      markdown_content: md,
      tags: [normalizedTaskType, "telegram", "budgetapp"]
    }
  });

  appendMemory({
    threadId: `telegram-${from.id}`,
    eventType: "task_update",
    content: `Created task ${task.id} (${normalizedTaskType}) from ${source}`
  });

  return {
    id: task.id,
    name: task.name,
    type: normalizedTaskType,
    agent: TASK_TYPE_TO_AGENT[normalizedTaskType],
    url: task.url
  };
}

async function createTaskFromMessage({ from, text }) {
  if (text.startsWith("/task ")) {
    const payload = text.slice("/task ".length).trim();
    const parts = payload.split("|").map((x) => x.trim());
    if (parts.length < 2) {
      throw new Error("Formato: /task <task_type> | <titulo> | <descripcion>");
    }
    return createTask({
      from,
      taskType: parts[0],
      title: parts[1],
      description: parts.slice(2).join(" | "),
      source: "telegram-command"
    });
  }

  return createTask({
    from,
    title: text.length > 110 ? `${text.slice(0, 107)}...` : text,
    description: text,
    source: "telegram-fallback"
  });
}

async function getTaskStatus(taskId) {
  const task = await getScopedTask(taskId);
  return {
    id: task.id,
    name: task.name,
    status: task.status?.status || "-",
    priority: task.priority?.priority || null,
    assignees: Array.isArray(task.assignees)
      ? task.assignees.map((a) => ({
          id: String(a.id),
          username: a.username || ""
        }))
      : [],
    url: task.url
  };
}

async function setTaskStatus(taskId, status) {
  await getScopedTask(taskId);
  await clickupRequest("PUT", `/task/${taskId}`, {
    body: { status }
  });
}

async function commentTask(taskId, comment) {
  await getScopedTask(taskId);
  await clickupRequest("POST", `/task/${taskId}/comment`, {
    body: {
      comment_text: comment,
      notify_all: false
    }
  });
}

async function updateTask({
  taskId,
  title,
  description,
  priority,
  assigneeId,
  assigneeName,
  assignToRequester = false,
  requester
}) {
  const scopedTask = await getScopedTask(taskId);

  const body = {};
  const updates = {
    name: false,
    description: false,
    priority: false,
    assignee: false
  };

  if (title !== null && title !== undefined && String(title).trim()) {
    body.name = String(title).trim();
    updates.name = true;
  }

  if (description !== null && description !== undefined && String(description).trim()) {
    body.description = String(description).trim();
    updates.description = true;
  }

  if (priority !== null && priority !== undefined && priority !== "") {
    body.priority = parsePriority(priority);
    updates.priority = true;
  }

  const resolvedAssigneeId = await resolveAssigneeId({
    assigneeId,
    assigneeName,
    assignToRequester,
    requester,
    scopedTask
  });
  if (resolvedAssigneeId) {
    body.assignees = {
      add: [Number(resolvedAssigneeId)],
      rem: []
    };
    updates.assignee = true;
  }

  if (Object.keys(body).length === 0) {
    throw new Error(
      "update_task requiere al menos un cambio: title, description, priority, assignee."
    );
  }

  await clickupRequest("PUT", `/task/${taskId}`, { body });
  const task = await getTaskStatus(taskId);

  return {
    task,
    updates
  };
}

async function listTasks({ status, limit = 6 } = {}) {
  const listId = process.env.CLICKUP_LIST_ID;
  if (!listId || listId === "replace_me") {
    throw new Error("CLICKUP_LIST_ID is not configured.");
  }

  const response = await clickupRequest("GET", `/list/${listId}/task`, {
    query: {
      archived: false,
      page: 0
    }
  });

  let tasks = Array.isArray(response.tasks) ? response.tasks : [];
  if (status) {
    const wanted = String(status).toLowerCase().trim();
    tasks = tasks.filter((task) =>
      String(task.status?.status || "")
        .toLowerCase()
        .includes(wanted)
    );
  }

  tasks.sort(
    (a, b) => Number(b.date_updated || 0) - Number(a.date_updated || 0)
  );
  return tasks
    .slice(0, Math.max(1, Math.min(20, Number(limit) || 6)))
    .map((task) => ({
      id: task.id,
      name: task.name,
      status: task.status?.status || "-",
      priority: task.priority?.priority || null,
      assignees: Array.isArray(task.assignees)
        ? task.assignees.map((a) => ({
            id: String(a.id),
            username: a.username || ""
          }))
        : [],
      url: task.url
    }));
}

async function readRecentThreadMemory(threadId, limit = 8) {
  const file = getMemoryLogPath();
  if (!fs.existsSync(file)) return [];

  const normalizedLimit = Math.max(1, Math.min(30, Number(limit) || 8));
  const rows = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(file, { encoding: "utf8" }),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    if (event.thread_id !== threadId) continue;
    rows.push(event);
    if (rows.length > normalizedLimit) rows.shift();
  }

  return rows.map((event) => {
    const who = event.role === "user" ? "Usuario" : "Bot";
    return `[${event.created_at}] ${who}: ${String(event.content || "").slice(0, 280)}`;
  });
}

async function searchMemoryByQuery(query, limit = 5) {
  const file = getMemoryLogPath();
  if (!fs.existsSync(file)) return [];

  const needle = String(query || "").toLowerCase().trim();
  if (!needle) return [];

  const normalizedLimit = Math.max(1, Math.min(20, Number(limit) || 5));
  const rows = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(file, { encoding: "utf8" }),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    const haystack = [
      event.content || "",
      event.thread_id || "",
      event.agent_id || "",
      event.event_type || ""
    ]
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(needle)) continue;
    rows.push(event);
    if (rows.length > normalizedLimit) rows.shift();
  }

  return rows.map((event) => ({
    created_at: event.created_at,
    thread_id: event.thread_id,
    role: event.role,
    content: String(event.content || "").slice(0, 280)
  }));
}

function summarizeActionResult(result) {
  if (!result || result.ok !== true) {
    return `Accion fallida: ${result?.action || "unknown"} - ${result?.error || "sin detalle"}`;
  }

  if (result.action === "create_task") {
    return [
      `Tarea creada: ${result.task.id}`,
      `Tipo: ${result.task.type}`,
      `Agente objetivo: ${result.task.agent}`,
      result.task.url
    ].join("\n");
  }

  if (result.action === "get_task_status") {
    const assigneeText =
      Array.isArray(result.task.assignees) && result.task.assignees.length > 0
        ? result.task.assignees
            .map((a) => `${a.username || a.id} (${a.id})`)
            .join(", ")
        : "-";
    return [
      `Task ${result.task.id}`,
      `Nombre: ${result.task.name}`,
      `Estado: ${result.task.status}`,
      `Prioridad: ${result.task.priority || "-"}`,
      `Asignado: ${assigneeText}`,
      result.task.url
    ].join("\n");
  }

  if (result.action === "update_task") {
    const changed = [];
    if (result.updates?.name) changed.push("nombre");
    if (result.updates?.description) changed.push("descripcion");
    if (result.updates?.priority) changed.push("prioridad");
    if (result.updates?.assignee) changed.push("asignado");
    return [
      `Task ${result.task.id} actualizada (${changed.join(", ") || "sin detalle"}).`,
      `Nombre: ${result.task.name}`,
      `Estado: ${result.task.status}`,
      `Prioridad: ${result.task.priority || "-"}`,
      result.task.url
    ].join("\n");
  }

  if (result.action === "set_task_status") {
    return `Task ${result.task_id} actualizada a ${result.status}.`;
  }

  if (result.action === "comment_task") {
    return `Comentario agregado a ${result.task_id}.`;
  }

  if (result.action === "list_tasks") {
    if (!Array.isArray(result.tasks) || result.tasks.length === 0) {
      return "No encontre tareas para ese filtro.";
    }
    const lines = ["Tareas:"];
    for (const task of result.tasks) {
      const assigneeText =
        Array.isArray(task.assignees) && task.assignees.length > 0
          ? task.assignees
              .map((a) => a.username || a.id || "-")
              .filter(Boolean)
              .join(", ")
          : "sin asignar";
      lines.push(
        `- ${task.id} | ${task.status} | prioridad:${task.priority || "-"} | responsable:${assigneeText} | ${task.name}`
      );
      lines.push(task.url);
    }
    return lines.join("\n");
  }

  if (result.action === "search_memory") {
    if (!Array.isArray(result.hits) || result.hits.length === 0) {
      return "No encontre eventos de memoria para esa busqueda.";
    }
    const hits = result.hits.slice(0, 12);
    const lines = [
      `Memoria encontrada (${result.hits.length} coincidencias, mostrando ${hits.length}):`
    ];
    for (const hit of hits) {
      lines.push(
        `- ${hit.created_at} | ${hit.thread_id} | ${hit.role || "-"} | ${String(hit.content || "").slice(0, 180)}`
      );
    }
    return lines.join("\n");
  }

  return "Accion ejecutada.";
}

async function executePlannedAction({ action, from, threadId }) {
  const type = String(action?.type || "").trim();

  if (type === "create_task") {
    if (!action.title || !action.description) {
      throw new Error("create_task requiere title y description");
    }
    const task = await createTask({
      from,
      taskType: action.task_type,
      title: action.title,
      description: action.description,
      source: "telegram-codex"
    });
    return { ok: true, action: type, task };
  }

  if (type === "update_task") {
    if (!action.task_id) {
      throw new Error("update_task requiere task_id");
    }
    const updated = await updateTask({
      taskId: action.task_id,
      title: action.title,
      description: action.description,
      priority: action.priority,
      assigneeId: action.assignee_id,
      assigneeName: action.assignee_name,
      assignToRequester: Boolean(action.assign_to_requester),
      requester: from
    });
    return {
      ok: true,
      action: type,
      task: updated.task,
      updates: updated.updates
    };
  }

  if (type === "get_task_status") {
    if (!action.task_id) {
      throw new Error("get_task_status requiere task_id");
    }
    const task = await getTaskStatus(action.task_id);
    return { ok: true, action: type, task };
  }

  if (type === "set_task_status") {
    if (!action.task_id || !action.status) {
      throw new Error("set_task_status requiere task_id y status");
    }
    await setTaskStatus(action.task_id, action.status);
    return {
      ok: true,
      action: type,
      task_id: action.task_id,
      status: action.status
    };
  }

  if (type === "comment_task") {
    if (!action.task_id || !action.comment) {
      throw new Error("comment_task requiere task_id y comment");
    }
    await commentTask(action.task_id, action.comment);
    return {
      ok: true,
      action: type,
      task_id: action.task_id
    };
  }

  if (type === "list_tasks") {
    const tasks = await listTasks({
      status: action.status || undefined,
      limit: action.limit || undefined
    });
    return {
      ok: true,
      action: type,
      tasks
    };
  }

  if (type === "search_memory") {
    if (!action.query) {
      throw new Error("search_memory requiere query");
    }
    const hits = await searchMemoryByQuery(action.query, action.limit);
    return {
      ok: true,
      action: type,
      hits
    };
  }

  throw new Error(`Accion no soportada: ${type || "unknown"}`);
}

async function runAiAssistantForMessage({ msg, threadId, userText }) {
  if (!isLocalCodexEnabled()) {
    return null;
  }

  const recent = await readRecentThreadMemory(threadId, 8);
  const plan = await runLocalCodexPlanner({
    userMessage: String(userText || ""),
    threadId,
    requesterId: String(msg.from.id),
    requesterUsername: msg.from.username || "",
    requesterName: [msg.from.first_name, msg.from.last_name]
      .filter(Boolean)
      .join(" ")
      .trim(),
    recentMemory: recent
  });

  appendMemory({
    threadId,
    eventType: "tool_plan",
    content: `Local Codex plan -> ${JSON.stringify(plan).slice(0, 800)}`
  });

  if (plan.mode === "clarify") {
    return plan.reply || "Necesito un poco mas de detalle para ejecutarlo.";
  }

  if (plan.mode === "actions" && Array.isArray(plan.actions) && plan.actions.length > 0) {
    const chunks = [];
    if (plan.reply) chunks.push(plan.reply);

    for (const action of plan.actions) {
      const actionType = action?.type || "unknown";
      try {
        const result = await executePlannedAction({ action, from: msg.from, threadId });
        appendMemory({
          threadId,
          eventType: "tool_use",
          content: `Codex action ${actionType} -> ${JSON.stringify(result).slice(0, 600)}`
        });
        chunks.push(summarizeActionResult(result));
      } catch (error) {
        const failure = {
          ok: false,
          action: actionType,
          error: error.message
        };
        appendMemory({
          threadId,
          eventType: "error",
          content: `Codex action ${actionType} failed: ${error.message}`
        });
        chunks.push(summarizeActionResult(failure));
      }
    }

    return chunks.join("\n\n").trim();
  }

  if (plan.reply) {
    return plan.reply;
  }

  return null;
}

async function processAuthorizedMessage({ msg, text }) {
  const normalizedText = String(text || "").trim();
  if (!normalizedText) return "Solo proceso texto por ahora.";

  const commandText =
    msg && msg.text && String(msg.text).trim().startsWith("/")
      ? String(msg.text).trim()
      : normalizedText;

  if (commandText === "/start" || commandText === "/help") {
    return helpText();
  }

  if (commandText === "/ai" || commandText === "/ai status") {
    return aiStatusText();
  }

  if (commandText.startsWith("/status ")) {
    const taskId = commandText.slice("/status ".length).trim();
    if (!taskId) return "Uso: /status <task_id>";
    const st = await getTaskStatus(taskId);
    return `Task ${st.id}\nNombre: ${st.name}\nEstado: ${st.status}\n${st.url}`;
  }

  if (commandText.startsWith("/ready ")) {
    const taskId = commandText.slice("/ready ".length).trim();
    if (!taskId) return "Uso: /ready <task_id>";
    await setTaskStatus(taskId, "Ready");
    return `Task ${taskId} actualizada a Ready.`;
  }

  if (commandText.startsWith("/comment ")) {
    const payload = commandText.slice("/comment ".length).trim();
    const parts = payload.split("|").map((x) => x.trim());
    if (parts.length < 2) return "Uso: /comment <task_id> | <comentario>";
    await commentTask(parts[0], parts.slice(1).join(" | "));
    return `Comentario agregado a ${parts[0]}.`;
  }

  if (commandText.startsWith("/task ")) {
    const created = await createTaskFromMessage({
      from: msg.from,
      text: commandText
    });
    return [
      `Tarea creada: ${created.id}`,
      `Tipo: ${created.type}`,
      `Agente objetivo: ${created.agent}`,
      created.url
    ].join("\n");
  }

  if (commandText.startsWith("/")) {
    return "Comando no reconocido. Usa /help.";
  }

  const threadId = `telegram-${msg.from.id}`;
  const aiReply = await runAiAssistantForMessage({
    msg: { ...msg, text: normalizedText },
    threadId,
    userText: normalizedText
  });
  if (aiReply) return aiReply;

  const created = await createTaskFromMessage({
    from: msg.from,
    text: normalizedText
  });
  return [
    "AI no disponible, se aplico fallback.",
    `Tarea creada: ${created.id}`,
    `Tipo: ${created.type}`,
    `Agente objetivo: ${created.agent}`,
    created.url
  ].join("\n");
}

async function handleUpdate(update, allowedUsers) {
  const msg = update.message;
  if (!msg || !msg.from) return;

  const chatId = msg.chat?.id;
  const chatType = msg.chat?.type || "";
  const userId = String(msg.from.id);
  const threadId = `telegram-${userId}`;

  if (chatType !== "private") {
    await sendMessage(chatId, "Este bot solo acepta mensajes privados (DM).");
    return;
  }

  const bootstrapMaxUsers = parseBootstrapMaxUsers();
  let onboardingNote = null;

  if (!allowedUsers.has(userId)) {
    if (bootstrapMaxUsers > 0 && allowedUsers.size < bootstrapMaxUsers) {
      allowedUsers.add(userId);
      saveAllowlistToDisk(allowedUsers);
      onboardingNote = `Usuario autorizado (${allowedUsers.size}/${bootstrapMaxUsers}).`;
      appendMemory({
        threadId,
        eventType: "security_event",
        content: `Bootstrap authorized telegram user ${userId}`
      });
    } else {
      await sendMessage(
        chatId,
        "No autorizado para este bot. Contacta al owner para activar tu usuario."
      );
      appendMemory({
        threadId,
        eventType: "security_event",
        content: `Unauthorized telegram user ${userId} attempted command`
      });
      return;
    }
  }

  try {
    const rawText = String(msg.text || msg.caption || "").trim();
    const audioAttachment = getAudioAttachment(msg);

    await sendChatAction(chatId, "typing");
    if (shouldSendProcessingAck({ text: rawText, hasAudio: Boolean(audioAttachment) })) {
      await sendMessageSafe(
        chatId,
        audioAttachment
          ? "Recibido. Estoy transcribiendo tu audio y procesando la solicitud."
          : "Recibido. Estoy procesando tu solicitud, espera un momento."
      );
      await sendChatAction(chatId, "typing");
    }

    let incomingText = rawText;
    let transcriptionResult = null;
    if (audioAttachment) {
      transcriptionResult = await transcribeAudioMessage(msg);
      incomingText = rawText
        ? `${rawText}\n\nTranscripcion de audio:\n${transcriptionResult.text}`
        : transcriptionResult.text;
      await sendChatAction(chatId, "typing");
    }

    if (incomingText) {
      appendMemory({
        threadId,
        eventType: "conversation",
        role: "user",
        confidence: 1,
        metadata: {
          user_id: userId,
          username: msg.from.username || "-",
          input_type: transcriptionResult ? "audio" : "text",
          audio_kind: transcriptionResult?.attachment?.kind || null,
          audio_duration_sec: transcriptionResult?.attachment?.duration || null
        },
        content: incomingText
      });
    }

    const reply = await processAuthorizedMessage({
      msg,
      text: incomingText
    });
    const pieces = [];
    if (onboardingNote) pieces.push(onboardingNote);
    if (transcriptionResult) {
      const preview = transcriptionResult.text.slice(0, 180);
      const suffix = transcriptionResult.text.length > 180 ? "..." : "";
      pieces.push(`Audio transcrito: ${preview}${suffix}`);
    }
    pieces.push(reply);
    const message = pieces.join("\n\n");
    await sendMessageSafe(chatId, message);

    appendMemory({
      threadId,
      eventType: "conversation",
      role: "assistant",
      content: message
    });
  } catch (error) {
    try {
      await sendMessageSafe(chatId, `Error: ${error.message}`);
    } catch {
      // If Telegram send fails, keep loop alive and only log.
    }
    appendMemory({
      threadId,
      eventType: "error",
      content: `Telegram bot error for user ${userId}: ${error.message}`
    });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const allowedUsers = buildAllowedUsers();
  const bootstrapMaxUsers = parseBootstrapMaxUsers();
  if (allowedUsers.size === 0 && bootstrapMaxUsers === 0) {
    throw new Error(
      "Set TELEGRAM_ALLOWED_USER_IDS or TELEGRAM_BOOTSTRAP_MAX_USERS>0."
    );
  }

  let offset = loadOffset();
  const codexCfg = getLocalCodexConfig();
  const audioCfg = getAudioConfig();
  appendMemory({
    content: [
      `Telegram bot started. allowed_users=${[...allowedUsers].join(",")}`,
      `bootstrap_max_users=${bootstrapMaxUsers}`,
      `local_codex_enabled=${codexCfg.enabled}`,
      `local_codex_bin=${codexCfg.bin}`,
      `local_codex_workdir=${codexCfg.workdir}`,
      `local_codex_timeout_ms=${codexCfg.timeoutMs}`,
      `local_codex_max_actions=${codexCfg.maxActions}`,
      `audio_enabled=${audioCfg.enabled}`,
      `audio_max_seconds=${audioCfg.maxDurationSeconds}`,
      `audio_language=${audioCfg.language}`,
      `audio_whisper_bin=${audioCfg.whisperBin}`,
      `audio_whisper_model=${audioCfg.whisperModel}`
    ].join(" ")
  });

  while (true) {
    try {
      const updates = await getUpdates({ offset, timeout: 25 });
      if (Array.isArray(updates) && updates.length > 0) {
        for (const upd of updates) {
          await handleUpdate(upd, allowedUsers);
          offset = upd.update_id + 1;
          saveOffset(offset);
        }
      }
    } catch (error) {
      appendMemory({
        eventType: "error",
        content: `Polling error: ${error.message}`
      });
      await sleep(3000);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
