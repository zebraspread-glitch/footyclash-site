const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const DATA_PATH = path.join(__dirname, "../app/data/afl_players26.json");

const SOURCES = {
  disposals: {
    type: "footywire_average",
    url: "https://www.footywire.com/afl/footy/ft_player_rankings?year=2026&rt=LA&pt=&st=DI&mg=1",
    field: "disposals",
  },
  goals: {
    type: "footywire_total",
    url: "https://www.footywire.com/afl/footy/ft_player_rankings?year=2026&rt=LT&pt=&st=GO&mg=1",
    field: "goals",
  },
  kicks: {
    type: "footywire_average",
    url: "https://www.footywire.com/afl/footy/ft_player_rankings?year=2026&rt=LA&pt=&st=KI&mg=1",
    field: "kicks",
  },
  handballs: {
    type: "footywire_average",
    url: "https://www.footywire.com/afl/footy/ft_player_rankings?year=2026&rt=LA&pt=&st=HB&mg=1",
    field: "handballs",
  },
  marks: {
    type: "footywire_average",
    url: "https://www.footywire.com/afl/footy/ft_player_rankings?year=2026&rt=LA&pt=&st=MA&mg=1",
    field: "marks",
  },
  tackles: {
    type: "footywire_average",
    url: "https://www.footywire.com/afl/footy/ft_player_rankings?year=2026&rt=LA&pt=&st=TA&mg=1",
    field: "tackles",
  },
  hitouts: {
    type: "footywire_average",
    url: "https://www.footywire.com/afl/footy/ft_player_rankings?year=2026&rt=LA&pt=&st=HO&mg=1",
    field: "hitouts",
  },
  sc_points: {
    type: "footywire_average",
    url: "https://www.footywire.com/afl/footy/ft_player_rankings?year=2026&rt=LA&pt=&st=SU&mg=1",
    field: "sc_points",
  },
  bounces: {
    type: "footywire_total",
    url: "https://www.footywire.com/afl/footy/ft_player_rankings?year=2026&rt=LT&pt=&st=BO&mg=1",
    field: "bounces",
  },
  metres_gained: {
    type: "footywire_total",
    url: "https://www.footywire.com/afl/footy/ft_player_rankings?year=2026&rt=LT&pt=&st=MG&mg=1",
    field: "metres_gained",
  },
};

const TEAM_PATTERN =
  "(Crows|Lions|Blues|Magpies|Bombers|Dockers|Cats|Suns|Giants|Hawks|Demons|Kangaroos|Power|Tigers|Saints|Swans|Eagles|Bulldogs)";

const CLUB_ALIASES = {
  crows: "Adelaide",
  lions: "Brisbane",
  blues: "Carlton",
  magpies: "Collingwood",
  bombers: "Essendon",
  dockers: "Fremantle",
  cats: "Geelong",
  suns: "Gold Coast",
  giants: "GWS",
  hawks: "Hawthorn",
  demons: "Melbourne",
  kangaroos: "North Melbourne",
  power: "Port Adelaide",
  tigers: "Richmond",
  saints: "St Kilda",
  swans: "Sydney",
  eagles: "West Coast",
  bulldogs: "Western Bulldogs",

  "brisbane lions": "Brisbane",
  "gold coast suns": "Gold Coast",
  "greater western sydney": "GWS",
  "greater western sydney giants": "GWS",
  "gws giants": "GWS",
  "western bulldogs": "Western Bulldogs",
  "north melbourne": "North Melbourne",
  "port adelaide": "Port Adelaide",
  "west coast": "West Coast",
  "west coast eagles": "West Coast",
};

const NAME_ALIASES = {
  "thomas liberatore": "tom liberatore",
  "matthew crouch": "matt crouch",
  "zach bailey": "zac bailey",
  "alexander neal bullen": "alex neal bullen",
  "samuel powell pepper": "sam powell pepper",
  "edward richards": "ed richards",
  "cameron rayner": "cam rayner",
  "cameron zurhaar": "cam zurhaar",
  "benjamin king": "ben king",
  "maxwell king": "max king",
  "matt johnson": "matthew johnson",
  "matt carroll": "matthew carroll",
  "lachlan schultz": "lachie schultz",
  "timothy english": "tim english",
  "nick murray": "nicholas murray",
  "maurice rioli": "maurice rioli jr",
  "oliver wines": "ollie wines",

  "bailey macdonald": "bailey macdonald",
  "connor macdonald": "connor macdonald",
  "cameron mackenzie": "cam mackenzie",
  "bradley close": "brad close",
  "bailey j williams": "bailey williams",
  "lachlan fogarty": "lachie fogarty",
  "angus anderson": "angus anderson",
  "nick madden": "nicholas madden",
  "louis emmett": "louis emmett",

  "archie may": "archer may",
  "zac williams": "zachary williams",
  "lachie weller": "lachie weller",
  "jamarra ugle hagan": "jamarra uglehagan",
  "matthew cottrell": "matt cottrell",
  "nicholas haynes": "nick haynes",
  "mac andrew": "mac andrew",
};

const CLUB_ROSTER_URLS = {
  Adelaide: ["https://www.afc.com.au/teams/afl"],
  Brisbane: ["https://www.lions.com.au/teams/afl/squad"],
  Carlton: ["https://www.carltonfc.com.au/teams/afl"],
  Collingwood: ["https://www.collingwoodfc.com.au/teams/afl"],
  Essendon: ["https://www.essendonfc.com.au/teams/afl"],
  Fremantle: ["https://www.fremantlefc.com.au/teams/afl"],
  Geelong: ["https://www.geelongcats.com.au/teams/afl"],
  "Gold Coast": [
    "https://www.goldcoastfc.com.au/teams/afl/players",
    "https://www.goldcoastfc.com.au/teams/afl",
  ],
  GWS: ["https://www.gwsgiants.com.au/teams/afl"],
  Hawthorn: ["https://www.hawthornfc.com.au/teams/afl"],
  Melbourne: ["https://www.melbournefc.com.au/teams/afl"],
  "North Melbourne": ["https://www.nmfc.com.au/teams/afl/players"],
  "Port Adelaide": ["https://www.portadelaidefc.com.au/teams/afl"],
  Richmond: ["https://www.richmondfc.com.au/football/afl/squad"],
  "St Kilda": ["https://www.saints.com.au/afl/squad"],
  Sydney: ["https://www.sydneyswans.com.au/teams/afl"],
  "West Coast": ["https://www.westcoasteagles.com.au/teams/afl"],
  "Western Bulldogs": ["https://www.westernbulldogs.com.au/teams/afl"],
};

function cleanText(str) {
  return String(str || "")
    .replace(/\u00a0/g, " ")
    .replace(/[’']/g, "")
    .replace(/\./g, "")
    .replace(/-/g, " ")
    .replace(/\//g, " ")
    .replace(/\(/g, " ")
    .replace(/\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeClub(club) {
  const cleaned = cleanText(club);
  return CLUB_ALIASES[cleaned] || String(club || "").trim();
}

function normalizeName(name) {
  const cleaned = cleanText(name);
  return NAME_ALIASES[cleaned] || cleaned;
}

function makeKey(name, club) {
  return `${normalizeName(name)}|${cleanText(normalizeClub(club))}`;
}

function makeClubNumberKey(club, number) {
  return `${cleanText(normalizeClub(club))}|${Number(number)}`;
}

function parseNumber(value) {
  const cleaned = String(value ?? "").replace(/[^\d.-]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url} (${res.status})`);
  }

  return await res.text();
}

function getRowTexts(html) {
  const $ = cheerio.load(html);
  const rows = [];

  $("tr").each((_, tr) => {
    const text = $(tr).text().replace(/\s+/g, " ").trim();
    if (text) rows.push(text);
  });

  return rows;
}

function extractFootywireAverage(html) {
  const rows = getRowTexts(html);

  const rowRegex = new RegExp(
    `^\\d+\\s+(.+?)\\s+${TEAM_PATTERN}\\s+(\\d+)\\s+(-?\\d+(?:\\.\\d+)?)\\s+v\\s+.+?,\\s+Round\\s+\\d+\\s+(-?\\d+(?:\\.\\d+)?)$`
  );

  const results = new Map();

  for (const row of rows) {
    const match = row.match(rowRegex);
    if (!match) continue;

    const [, player, club, games, lastGameValue, average] = match;

    results.set(makeKey(player, club), {
      player: player.trim(),
      club: normalizeClub(club),
      games: parseNumber(games),
      lastGameValue: parseNumber(lastGameValue),
      value: parseNumber(average),
    });
  }

  if (!results.size) {
    throw new Error("Could not parse any FootyWire average rows.");
  }

  return results;
}

function extractFootywireTotal(html) {
  const rows = getRowTexts(html);

  const rowRegex = new RegExp(
    `^\\d+\\s+(.+?)\\s+${TEAM_PATTERN}\\s+(\\d+)\\s+(-?\\d+(?:\\.\\d+)?)\\s+v\\s+.+?,\\s+Round\\s+\\d+\\s+(-?\\d+(?:\\.\\d+)?)$`
  );

  const results = new Map();

  for (const row of rows) {
    const match = row.match(rowRegex);
    if (!match) continue;

    const [, player, club, games, lastGameValue, total] = match;

    results.set(makeKey(player, club), {
      player: player.trim(),
      club: normalizeClub(club),
      games: parseNumber(games),
      lastGameValue: parseNumber(lastGameValue),
      value: parseNumber(total),
    });
  }

  if (!results.size) {
    throw new Error("Could not parse any FootyWire total rows.");
  }

  return results;
}

function mapRosterPositionToGamePositions(rawPosition) {
  const text = cleanText(rawPosition);
  if (!text) return [];

  const positions = [];

  if (text.includes("ruck")) positions.push("RUCK");
  if (text.includes("mid") || text.includes("wing")) positions.push("MID");
  if (text.includes("forward")) positions.push("FWD");
  if (text.includes("def")) positions.push("DEF");

  return [...new Set(positions)];
}

function isLikelyPlayerName(name) {
  const cleaned = String(name || "").trim();

  if (!cleaned) return false;
  if (cleaned.length < 4) return false;
  if (/\d/.test(cleaned)) return false;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;

  return words.every((word) => /^[A-Za-zÀ-ÿ' -]+$/.test(word));
}

function extractRosterPositionsFromClubPage(html, club) {
  const $ = cheerio.load(html);

  const byName = new Map();
  const byNumber = new Map();

  const candidateTexts = [];

  $("a").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) candidateTexts.push(text);
  });

  $.text()
    .split("\n")
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .forEach((x) => candidateTexts.push(x));

  const seen = new Set();

  const positionPatterns = [
    "Key Defender",
    "Key Forward",
    "Defender",
    "Midfielder",
    "Forward",
    "Ruck",
    "Wing",
    "Defender/Midfielder",
    "Defender/Forward",
    "Forward/Midfielder",
    "Midfielder/Forward",
    "Key Forward/Ruck",
    "Ruck/Forward",
    "Forward/Ruck",
    "Midfielder/Defender",
  ];

  const positionRegexPart = positionPatterns
    .map((x) => x.replace(/\//g, "\\/"))
    .sort((a, b) => b.length - a.length)
    .join("|");

  const rosterRegex = new RegExp(
    `^(\\d{1,2})\\s+([A-Za-zÀ-ÿ' -]+?)\\s+(${positionRegexPart})$`,
    "i"
  );

  for (const rawLine of candidateTexts) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    if (!line || seen.has(line)) continue;
    seen.add(line);

    const match = line.match(rosterRegex);
    if (!match) continue;

    const [, guernseyRaw, rawName, rawPosition] = match;
    const number = parseNumber(guernseyRaw);
    const name = rawName.trim();
    const value = mapRosterPositionToGamePositions(rawPosition);

    if (!number || !isLikelyPlayerName(name) || !value.length) continue;

    const item = {
      player: name,
      club,
      number,
      rawPosition: rawPosition.trim(),
      value,
    };

    byName.set(makeKey(name, club), item);
    byNumber.set(makeClubNumberKey(club, number), item);
  }

  if (!byName.size && !byNumber.size) {
    throw new Error(`Could not parse any roster positions for ${club}.`);
  }

  return { byName, byNumber };
}

async function fetchClubRosterPage(club) {
  const urls = CLUB_ROSTER_URLS[club] || [];
  let lastError = null;

  for (const url of urls) {
    try {
      const html = await fetchHtml(url);
      return { url, html };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error(`No roster URLs configured for ${club}`);
}

async function fetchOfficialClubPositions(players) {
  console.log("Fetching official club roster positions...");

  const clubs = [...new Set(players.map((p) => normalizeClub(p.club)).filter(Boolean))];
  const byName = new Map();
  const byNumber = new Map();

  for (const club of clubs) {
    try {
      const { url, html } = await fetchClubRosterPage(club);
      console.log(`Fetched ${club} roster: ${url}`);

      const parsed = extractRosterPositionsFromClubPage(html, club);

      console.log(
        `Parsed ${club} positions: ${parsed.byName.size} by name, ${parsed.byNumber.size} by number`
      );

      for (const [key, value] of parsed.byName) {
        byName.set(key, value);
      }

      for (const [key, value] of parsed.byNumber) {
        byNumber.set(key, value);
      }
    } catch (err) {
      console.log(`Skipping ${club} positions: ${err.message}`);
    }
  }

  if (!byName.size && !byNumber.size) {
    throw new Error("Could not parse any official club roster positions.");
  }

  return { byName, byNumber };
}

function loadPlayers() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}

function savePlayers(players) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(players, null, 2) + "\n", "utf8");
}

function ensureField(player, field) {
  if (!(field in player)) {
    player[field] = 0;
  }
}

function ensurePosArray(player) {
  if (!Array.isArray(player.pos)) {
    player.pos = [];
  }
}

async function fetchAndParseSource(sourceKey, config) {
  console.log(`Fetching ${sourceKey}...`);
  const html = await fetchHtml(config.url);

  console.log(`Parsing ${sourceKey}...`);
  if (config.type === "footywire_average") {
    return extractFootywireAverage(html);
  }
  if (config.type === "footywire_total") {
    return extractFootywireTotal(html);
  }

  throw new Error(`Unknown source type: ${config.type}`);
}

async function main() {
  console.log("Loading player file...");
  const players = loadPlayers();

  const parsedSources = {};
  for (const [sourceKey, config] of Object.entries(SOURCES)) {
    try {
      parsedSources[sourceKey] = await fetchAndParseSource(sourceKey, config);
    } catch (err) {
      console.log(`Skipping ${sourceKey}: ${err.message}`);
      parsedSources[sourceKey] = new Map();
    }
  }

  let parsedPositions = { byName: new Map(), byNumber: new Map() };
  try {
    parsedPositions = await fetchOfficialClubPositions(players);
  } catch (err) {
    console.log(`Skipping positions: ${err.message}`);
  }

  const updateCounts = {};
  const unmatched = {};

  for (const key of Object.keys(SOURCES)) {
    updateCounts[key] = 0;
    unmatched[key] = [];
  }

  updateCounts.positions = 0;
  unmatched.positions = [];

  for (const player of players) {
    const clubKey = makeKey(player.name, player.club);
    const clubNumberKey = makeClubNumberKey(player.club, player.number);

    for (const [sourceKey, config] of Object.entries(SOURCES)) {
      ensureField(player, config.field);

      const sourceMap = parsedSources[sourceKey];
      const entry = sourceMap.get(clubKey) || null;

      if (!entry) continue;

      const oldValue = Number(player[config.field] || 0);
      const newValue = entry.value;

      if (oldValue !== newValue) {
        player[config.field] = newValue;
        updateCounts[sourceKey] += 1;
      }

      sourceMap.delete(clubKey);
    }

    ensurePosArray(player);

    const positionEntry =
      parsedPositions.byName.get(clubKey) ||
      parsedPositions.byNumber.get(clubNumberKey) ||
      null;

    if (positionEntry && Array.isArray(positionEntry.value) && positionEntry.value.length) {
      const newPositions = [
        ...new Set(positionEntry.value.map((x) => String(x).trim().toUpperCase())),
      ].sort();

      const oldPositions = [
        ...new Set((player.pos || []).map((x) => String(x).trim().toUpperCase())),
      ].sort();

      if (JSON.stringify(oldPositions) !== JSON.stringify(newPositions)) {
        player.pos = newPositions;
        updateCounts.positions += 1;
      }

      parsedPositions.byName.delete(clubKey);
      parsedPositions.byNumber.delete(clubNumberKey);
    }
  }

  for (const [sourceKey, config] of Object.entries(SOURCES)) {
    const sourceMap = parsedSources[sourceKey];

    for (const [, item] of sourceMap) {
      unmatched[sourceKey].push(`${item.player} (${item.club})`);
    }
  }

  for (const [, item] of parsedPositions.byName) {
    unmatched.positions.push(`${item.player} (${item.club}) -> ${item.value.join("/")}`);
  }

  savePlayers(players);

  console.log("");
  console.log("Done.");
  console.log("");

  for (const [sourceKey, config] of Object.entries(SOURCES)) {
    console.log(`${config.field} updated: ${updateCounts[sourceKey]}`);
    console.log(`Unmatched ${config.field}: ${unmatched[sourceKey].length}`);

    if (unmatched[sourceKey].length) {
      unmatched[sourceKey]
        .slice(0, 15)
        .forEach((x) => console.log(`- ${x}`));
      console.log("");
    }
  }

  console.log(`positions updated: ${updateCounts.positions}`);
  console.log(`Unmatched positions: ${unmatched.positions.length}`);
  if (unmatched.positions.length) {
    unmatched.positions
      .slice(0, 25)
      .forEach((x) => console.log(`- ${x}`));
    console.log("");
  }
}

main().catch((err) => {
  console.error("");
  console.error("Update failed:");
  console.error(err);
  process.exit(1);
});