const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const OUTPUT_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  properties: {
    mode: { type: "string", enum: ["reply", "actions", "clarify"] },
    reply: { type: "string" },
    actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: [
              "create_task",
              "update_task",
              "get_task_status",
              "set_task_status",
              "comment_task",
              "list_tasks",
              "search_memory"
            ]
          },
          task_id: { type: ["string", "null"] },
          status: { type: ["string", "null"] },
          comment: { type: ["string", "null"] },
          task_type: { type: ["string", "null"] },
          title: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
          priority: { type: ["number", "string", "null"] },
          assignee_id: { type: ["number", "string", "null"] },
          assignee_name: { type: ["string", "null"] },
          assign_to_requester: { type: ["boolean", "null"] },
          query: { type: ["string", "null"] },
          limit: { type: ["number", "null"] }
        },
        required: [
          "type",
          "task_id",
          "status",
          "comment",
          "task_type",
          "title",
          "description",
          "priority",
          "assignee_id",
          "assignee_name",
          "assign_to_requester",
          "query",
          "limit"
        ]
      }
    }
  },
  required: ["mode", "reply", "actions"]
};

function truthy(raw) {
  return /^(1|true|yes|on)$/i.test(String(raw || "").trim());
}

function parsePositiveInt(raw, fallback, max) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  const value = Math.floor(parsed);
  return Number.isFinite(max) ? Math.min(value, max) : value;
}

function getLocalCodexConfig() {
  const appRoot = path.join(__dirname, "..");
  return {
    enabled: truthy(process.env.TELEGRAM_CODEX_ENABLED ?? "1"),
    bin: process.env.TELEGRAM_CODEX_BIN || "codex",
    workdir: process.env.TELEGRAM_CODEX_WORKDIR || appRoot,
    timeoutMs: parsePositiveInt(process.env.TELEGRAM_CODEX_TIMEOUT_MS, 120000),
    maxActions: parsePositiveInt(process.env.TELEGRAM_CODEX_MAX_ACTIONS, 4, 8)
  };
}

function isLocalCodexEnabled() {
  return getLocalCodexConfig().enabled;
}

function buildPlannerPrompt({
  userMessage,
  threadId,
  requesterId,
  requesterUsername,
  requesterName,
  recentMemory
}) {
  const contextText =
    recentMemory && recentMemory.length > 0
      ? recentMemory.map((line) => `- ${line}`).join("\n")
      : "- (sin contexto previo)";

  return [
    "Eres un planificador operacional para un bot de Telegram de BudgetApp.",
    "Tu salida debe ser JSON valido segun el schema.",
    "",
    "Reglas:",
    "- Usa mode='actions' cuando debas ejecutar acciones operativas.",
    "- Usa mode='clarify' si falta informacion critica. reply debe ser una pregunta breve.",
    "- Usa mode='reply' para respuesta informativa sin acciones.",
    "- No inventes IDs de task.",
    "- Todas las acciones de tareas deben ser del proyecto/lista actual de BudgetApp.",
    "- No uses markdown; reply corto.",
    "",
    "Tipos de accion permitidos:",
    "- create_task: requiere title y description. task_type opcional.",
    "- update_task: para editar una tarea existente (titulo, descripcion, prioridad, asignacion).",
    "- get_task_status: requiere task_id.",
    "- set_task_status: requiere task_id y status.",
    "- comment_task: requiere task_id y comment.",
    "- list_tasks: status opcional, limit opcional.",
    "- search_memory: query requerido, limit opcional.",
    "",
    "Task types validos: market_research, competitor_analysis, product_design, web_development, content_seo, ops_automation, qa_review.",
    "Para prioridad usa: urgent/high/normal/low o 1..4.",
    "Si el usuario dice 'asignamela a mi', usa update_task con assign_to_requester=true.",
    "",
    `Thread: ${threadId}`,
    `Requester ID: ${requesterId}`,
    `Requester username: ${requesterUsername || "-"}`,
    `Requester name: ${requesterName || "-"}`,
    "",
    "Contexto reciente:",
    contextText,
    "",
    "Mensaje del usuario:",
    userMessage
  ].join("\n");
}

function runCodexExec({ bin, workdir, timeoutMs, prompt }) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "budgetapp-codex-"));
  const schemaPath = path.join(tmpDir, "schema.json");
  const outputPath = path.join(tmpDir, "last-message.txt");
  fs.writeFileSync(schemaPath, JSON.stringify(OUTPUT_SCHEMA, null, 2), "utf8");

  const binDir = path.dirname(bin);
  const nodeDir = path.dirname(process.execPath);
  const currentPath = process.env.PATH || "";
  const safePath = [binDir, nodeDir, currentPath]
    .filter(Boolean)
    .join(path.delimiter);

  return new Promise((resolve, reject) => {
    const args = [
      "exec",
      "-C",
      workdir,
      "--skip-git-repo-check",
      "--sandbox",
      "read-only",
      "--output-schema",
      schemaPath,
      "-o",
      outputPath,
      "-"
    ];

    const child = spawn(bin, args, {
      cwd: workdir,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PATH: safePath
      }
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 4000).unref();
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      try {
        if (timedOut) {
          throw new Error(`Local Codex timeout after ${timeoutMs}ms`);
        }
        if (code !== 0) {
          const details = (stderr || stdout || "").slice(-2000);
          throw new Error(`Local Codex exited with code ${code}: ${details}`);
        }

        const raw = fs.readFileSync(outputPath, "utf8").trim();
        if (!raw) {
          throw new Error("Local Codex returned empty output.");
        }
        const parsed = JSON.parse(raw);
        resolve(parsed);
      } catch (error) {
        reject(error);
      } finally {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {
          // ignore cleanup errors
        }
      }
    });

    child.stdin.end(prompt);
  });
}

function normalizePlannerOutput(raw) {
  const mode =
    raw && typeof raw.mode === "string" ? raw.mode.trim().toLowerCase() : "reply";
  const safeMode = ["reply", "actions", "clarify"].includes(mode)
    ? mode
    : "reply";

  const reply = raw && typeof raw.reply === "string" ? raw.reply.trim() : "";
  const actions = Array.isArray(raw?.actions) ? raw.actions : [];

  return {
    mode: safeMode,
    reply: reply || (safeMode === "clarify" ? "Necesito mas contexto." : ""),
    actions
  };
}

async function runLocalCodexPlanner({
  userMessage,
  threadId,
  requesterId,
  requesterUsername,
  requesterName,
  recentMemory
}) {
  const cfg = getLocalCodexConfig();
  if (!cfg.enabled) {
    return {
      mode: "reply",
      reply: "",
      actions: []
    };
  }

  const prompt = buildPlannerPrompt({
    userMessage,
    threadId,
    requesterId,
    requesterUsername,
    requesterName,
    recentMemory
  });

  const raw = await runCodexExec({
    bin: cfg.bin,
    workdir: cfg.workdir,
    timeoutMs: cfg.timeoutMs,
    prompt
  });

  const normalized = normalizePlannerOutput(raw);
  if (normalized.actions.length > cfg.maxActions) {
    normalized.actions = normalized.actions.slice(0, cfg.maxActions);
  }
  return normalized;
}

module.exports = {
  getLocalCodexConfig,
  isLocalCodexEnabled,
  runLocalCodexPlanner
};
