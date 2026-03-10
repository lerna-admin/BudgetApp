const { getUpdates } = require("./telegram-client");

async function main() {
  const updates = await getUpdates({ timeout: 1 });
  const users = new Map();
  const chats = new Map();

  for (const upd of updates) {
    const msg = upd.message;
    if (!msg) continue;
    const from = msg.from;
    const chat = msg.chat;

    if (from) {
      users.set(String(from.id), {
        id: String(from.id),
        username: from.username || null,
        name: [from.first_name, from.last_name].filter(Boolean).join(" ").trim(),
        is_bot: from.is_bot || false
      });
    }

    if (chat) {
      chats.set(String(chat.id), {
        id: String(chat.id),
        type: chat.type,
        title: chat.title || null,
        username: chat.username || null
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        updates: updates.length,
        users: [...users.values()],
        chats: [...chats.values()]
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
