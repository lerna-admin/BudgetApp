const { clickupRequest } = require("./clickup-client");

function usage() {
  console.log("Usage:");
  console.log("  npm run clickup:scan -- [--team <team_id>] [--filter <text>]");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    args[key] = value;
    i += 1;
  }
  return args;
}

function containsFilter(text, filter) {
  if (!filter) return true;
  return String(text || "")
    .toLowerCase()
    .includes(filter.toLowerCase());
}

async function scanTeam(teamId, filter) {
  const spacesData = await clickupRequest("GET", `/team/${teamId}/space`);
  const spaces = Array.isArray(spacesData?.spaces) ? spacesData.spaces : [];
  const tree = [];

  for (const space of spaces) {
    const spaceEntry = {
      id: String(space.id),
      name: space.name,
      folders: [],
      folderless_lists: []
    };

    const foldersData = await clickupRequest("GET", `/space/${space.id}/folder`);
    const folders = Array.isArray(foldersData?.folders) ? foldersData.folders : [];
    for (const folder of folders) {
      const listsData = await clickupRequest("GET", `/folder/${folder.id}/list`);
      const lists = Array.isArray(listsData?.lists) ? listsData.lists : [];
      spaceEntry.folders.push({
        id: String(folder.id),
        name: folder.name,
        lists: lists.map((list) => ({
          id: String(list.id),
          name: list.name
        }))
      });
    }

    const folderlessData = await clickupRequest("GET", `/space/${space.id}/list`);
    const folderlessLists = Array.isArray(folderlessData?.lists)
      ? folderlessData.lists
      : [];
    spaceEntry.folderless_lists = folderlessLists.map((list) => ({
      id: String(list.id),
      name: list.name
    }));

    const matchesSpace =
      containsFilter(spaceEntry.name, filter) ||
      spaceEntry.folders.some(
        (folder) =>
          containsFilter(folder.name, filter) ||
          folder.lists.some((list) => containsFilter(list.name, filter))
      ) ||
      spaceEntry.folderless_lists.some((list) => containsFilter(list.name, filter));

    if (matchesSpace) tree.push(spaceEntry);
  }

  return tree;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    usage();
    process.exit(0);
  }

  const args = parseArgs(argv);
  const filter = args.filter || "";
  const explicitTeam = args.team || process.env.CLICKUP_TEAM_ID;

  let teams = [];
  if (explicitTeam && explicitTeam !== "replace_me") {
    teams = [{ id: explicitTeam, name: "selected-team" }];
  } else {
    const teamData = await clickupRequest("GET", "/team");
    teams = (teamData.teams || []).map((team) => ({
      id: String(team.id),
      name: team.name
    }));
  }

  const result = [];
  for (const team of teams) {
    const tree = await scanTeam(team.id, filter);
    result.push({
      team_id: team.id,
      team_name: team.name,
      spaces: tree
    });
  }

  console.log(JSON.stringify({ teams: result }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
