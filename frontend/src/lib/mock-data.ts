export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface Duck {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  level: number;
  xp: number;
  xpMax: number;
  evolutionStage: number;
  evolutionPath: string[];
  description: string;
  unlockedAt?: string;
}

export interface RoomMember {
  id: string;
  name: string;
  avatar: string;
  status: "focused" | "distracted" | "break" | "offline";
  score: number;
  streak: number;
  activeDuck: Duck;
}

export interface Room {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  members: RoomMember[];
  topic: string;
  isPrivate: boolean;
}

export const EVOLUTION_PATHS: Record<string, string[]> = {
  scholar:  ["🐣 Tiny Duck", "📚 Student Duck", "🎓 Scholar Duck", "👨‍🏫 Professor Duck"],
  pirate:   ["🐣 Tiny Duck", "🏴‍☠️ Pirate Duck",  "⚓ Captain Duck",  "👑 Sea King Duck"],
  cyber:    ["🐣 Tiny Duck", "💻 Cyber Duck",    "✨ Neon Duck",     "🔮 Quantum Duck"],
  knight:   ["🐣 Tiny Duck", "⚔️ Knight Duck",   "🛡️ Guardian Duck", "👑 King Duck"],
  wizard:   ["🐣 Tiny Duck", "🧙 Wizard Duck",   "🔮 Mage Duck",     "⚡ Archmage Duck"],
};

export const MOCK_DUCKS: Duck[] = [
  { id: "1", name: "Professor Quacksworth", emoji: "👨‍🏫", rarity: "legendary", level: 12, xp: 340, xpMax: 500, evolutionStage: 3, evolutionPath: EVOLUTION_PATHS.scholar, description: "Ancient and wise. Boosts XP from long sessions.", unlockedAt: "7-day streak" },
  { id: "2", name: "Cyber Quack",           emoji: "💻", rarity: "epic",      level: 7,  xp: 180, xpMax: 300, evolutionStage: 2, evolutionPath: EVOLUTION_PATHS.cyber,   description: "Interfaces directly with the matrix." },
  { id: "3", name: "Captain Mallard",       emoji: "⚓", rarity: "rare",      level: 5,  xp: 90,  xpMax: 200, evolutionStage: 2, evolutionPath: EVOLUTION_PATHS.pirate,  description: "Sails the seas of productivity." },
  { id: "4", name: "Student Duck",          emoji: "📚", rarity: "common",    level: 3,  xp: 45,  xpMax: 100, evolutionStage: 1, evolutionPath: EVOLUTION_PATHS.scholar, description: "Just getting started. Full of potential." },
  { id: "5", name: "Quantum Quack",         emoji: "🔮", rarity: "mythic",    level: 20, xp: 980, xpMax: 1000, evolutionStage: 3, evolutionPath: EVOLUTION_PATHS.cyber,  description: "Exists in multiple focus sessions simultaneously.", unlockedAt: "30-day streak" },
];

export const MOCK_ROOMS: Room[] = [
  {
    id: "1", name: "Finals Week Grind", emoji: "📚", memberCount: 4, topic: "CS Midterms", isPrivate: false,
    members: [
      { id: "1", name: "Alex",  avatar: "👦", status: "focused",    score: 87, streak: 5, activeDuck: MOCK_DUCKS[0] },
      { id: "2", name: "Maya",  avatar: "👧", status: "focused",    score: 92, streak: 8, activeDuck: MOCK_DUCKS[4] },
      { id: "3", name: "Jordan",avatar: "🧑", status: "distracted", score: 31, streak: 0, activeDuck: MOCK_DUCKS[2] },
      { id: "4", name: "Sam",   avatar: "👱", status: "break",      score: 65, streak: 3, activeDuck: MOCK_DUCKS[1] },
    ],
  },
  {
    id: "2", name: "Coding Sprint", emoji: "💻", memberCount: 2, topic: "Side Projects", isPrivate: false,
    members: [
      { id: "5", name: "Chris", avatar: "👨‍💻", status: "focused", score: 95, streak: 12, activeDuck: MOCK_DUCKS[4] },
      { id: "6", name: "Dana",  avatar: "👩‍💻", status: "focused", score: 88, streak: 7,  activeDuck: MOCK_DUCKS[1] },
    ],
  },
];

export const ACHIEVEMENTS = [
  { id: "1", name: "First Flight",    emoji: "🐣", description: "Complete your first focus session", unlocked: true },
  { id: "2", name: "Week Warrior",    emoji: "🔥", description: "7-day focus streak",                unlocked: true },
  { id: "3", name: "Quack Scholar",   emoji: "📚", description: "10 hours of total focus time",      unlocked: true },
  { id: "4", name: "Flock Leader",    emoji: "👑", description: "Host 5 focus rooms",                unlocked: false },
  { id: "5", name: "Quantum Quacker", emoji: "🔮", description: "Reach a 30-day streak",             unlocked: false },
];
