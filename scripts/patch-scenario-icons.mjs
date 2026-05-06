import fs from "fs";

const path = "src/data/scenarios.js";
let s = fs.readFileSync(path, "utf8");
const byId = {
  "work-intro": "hand",
  "job-interview": "briefcase",
  "small-talk": "cup",
  "boss-help": "hand",
  "criticism-manager": "shield",
  "meeting-speakup": "spark",
  "meeting-new": "hand",
  "ending-convo": "hand",
  "group-convo": "bubbles",
  "plans-friend": "calendar",
  "reconnect-longtime": "spark",
  "asking-help": "hand",
  "phone-call": "question",
  "restaurant-order": "cup",
  "shop-return": "briefcase",
  "neighbour-chat": "sun",
  "handling-conflict": "shield",
  "say-no-friend": "shield",
  "rude-person": "shield",
  "apologise-wrong": "heart",
  "disagree-respect": "shield",
  "ask-date": "heart",
  "partner-difficult": "bubble",
  "boundary-friend": "shield",
  "hard-truth-friend": "spark",
  accommodations: "briefcase",
  "doctor-needs": "question",
  "stand-up-self": "shield",
  "negotiate-deadline": "hand",
  "bonus-transport": "calendar",
  "bonus-compliment": "spark",
  "bonus-directions": "question",
};

for (const [id, key] of Object.entries(byId)) {
  const re = new RegExp(`(id: "${id}"[\\s\\S]*?icon:\\s*)"[^"]*"`, "m");
  if (!re.test(s)) {
    console.error("miss", id);
    process.exit(1);
  }
  s = s.replace(re, `$1"${key}"`);
}

fs.writeFileSync(path, s);
console.log("patched scenarios icons");
