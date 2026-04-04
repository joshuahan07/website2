import { Rank } from '@/types/game';

export type ThemeId = 'kingdom' | 'pirate' | 'greek';

export interface Theme {
  id: ThemeId;
  name: string;
  icon: string;
  pieceNames: Record<Rank, string>;
  pieceEmojis: Record<Rank, string>;
  pieceImages: Record<Rank, string>;
  enemyPieceImage: string;
  board: {
    lightSquare: string;
    darkSquare: string;
    lakeName: string;
    lakeClass: string;
    playerColors: {
      1: string;
      2: string;
    };
    playerBg: {
      1: string;
      2: string;
    };
    playerBorder: {
      1: string;
      2: string;
    };
    backgroundClass: string;
    lakeAnimationClass: string;
  };
  flavor: {
    setupTitle: string;
    yourTurn: string;
    waiting: string;
    win: string;
    lose: string;
  };
  revealTitles: {
    combat: string;
    scout_move: string;
    spy_kills_marshal: string;
    miner_defuses_bomb: string;
    spotter_reveal: string;
  };
  pieceReference: {
    flagDesc: string;
    bombDesc: string;
    spyDesc: string;
    spotterDesc: string;
    scoutDesc: string;
    minerDesc: string;
    midTier: string;
    highOfficers: string;
    generalDesc: string;
    marshalDesc: string;
    combatRule: string;
  };
}

const KINGDOM_THEME: Theme = {
  id: 'kingdom',
  name: 'Kingdom',
  icon: '\u{1F3F0}',
  pieceNames: {
    'F': 'Princess', 'B': 'Spike Pit', '0': 'Assassin',
    '1': 'Tower Guard', '2': 'Horseman', '3': 'Blacksmith',
    '4': 'Jester', '5': 'Swordsman', '6': 'Archer',
    '7': 'Kingsguard', '8': 'Prince', '9': 'Queen',
    '10': 'King',
  },
  pieceEmojis: {
    'F': '\u{1F467}', 'B': '\u26A0\uFE0F', '0': '\u{1F5E1}\uFE0F',
    '1': '\u{1F3F0}', '2': '\u{1F40E}', '3': '\u{1F528}',
    '4': '\u{1F0CF}', '5': '\u2694\uFE0F', '6': '\u{1F3F9}',
    '7': '\u{1F6E1}\uFE0F', '8': '\u{1F934}', '9': '\u{1F478}',
    '10': '\u{1F451}',
  },
  pieceImages: {
    'F': '/images/kingdom/princess.png',
    'B': '/images/kingdom/spike-pit.png',
    '0': '/images/kingdom/assassin.png',
    '1': '/images/kingdom/tower-guard.png',
    '2': '/images/kingdom/horseman.png',
    '3': '/images/kingdom/blacksmith.png',
    '4': '/images/kingdom/jester.png',
    '5': '/images/kingdom/swordsman.png',
    '6': '/images/kingdom/archer.png',
    '7': '/images/kingdom/kingsguard.png',
    '8': '/images/kingdom/prince.png',
    '9': '/images/kingdom/queen.png',
    '10': '/images/kingdom/king.png',
  },
  enemyPieceImage: '/images/kingdom/enemy-piece.png',
  board: {
    lightSquare: '#8a8278',
    darkSquare: '#4a4640',
    lakeName: 'Moat',
    lakeClass: 'lake-moat',
    playerColors: { 1: '#7a1a1a', 2: '#1a2a5a' },
    playerBg: { 1: 'from-[#7a1a1a]/90 to-[#4a0e0e]/90', 2: 'from-[#1a2a5a]/90 to-[#0e1a3a]/90' },
    playerBorder: { 1: 'border-[#c44]/50', 2: 'border-[#48c]/50' },
    backgroundClass: 'theme-kingdom-board',
    lakeAnimationClass: 'lake-moat-animated',
  },
  flavor: {
    setupTitle: 'Fortify Your Castle',
    yourTurn: 'Your Move, Your Majesty',
    waiting: 'The enemy plots beyond the walls...',
    win: 'The Kingdom is Yours!',
    lose: 'The Castle Has Fallen...',
  },
  revealTitles: {
    combat: 'COMBAT!',
    scout_move: 'HORSEMAN SPOTTED!',
    spy_kills_marshal: 'ASSASSINATION!',
    miner_defuses_bomb: 'PIT DISARMED!',
    spotter_reveal: 'TOWER GUARD PREDICTION!',
  },
  pieceReference: {
    flagDesc: 'Princess \u2014 Immovable. Capture = win',
    bombDesc: 'Spike Pit \u2014 Immovable. Destroys attackers',
    spyDesc: 'Assassin \u2014 Kills King if attacking',
    spotterDesc: 'Tower Guard \u2014 Predict enemy rank',
    scoutDesc: 'Horseman \u2014 Moves in straight lines',
    minerDesc: 'Blacksmith \u2014 Defuses Spike Pits',
    midTier: 'Standard combat pieces',
    highOfficers: 'Higher officers',
    generalDesc: 'Queen',
    marshalDesc: 'King \u2014 Highest rank',
    combatRule: 'Higher rank wins in combat. Equal = both die.',
  },
};

const PIRATE_THEME: Theme = {
  id: 'pirate',
  name: 'Pirate',
  icon: '\u{1F3F4}\u200D\u2620\uFE0F',
  pieceNames: {
    'F': 'Treasure Chest', 'B': 'Sea Mine', '0': 'Stowaway',
    '1': 'Watchman', '2': 'Parrot', '3': 'Diver',
    '4': 'Crewmate', '5': 'Buccaneer', '6': 'Musketeer',
    '7': 'Shark Rider', '8': 'Megalodon', '9': 'Pirate King',
    '10': 'Kraken',
  },
  pieceEmojis: {
    'F': '\u{1F4B0}', 'B': '\u{1F4A3}', '0': '\u{1F400}',
    '1': '\u{1F52D}', '2': '\u{1F99C}', '3': '\u{1F93F}',
    '4': '\u{1F9D1}\u200D\u2708\uFE0F', '5': '\u2693', '6': '\u{1F52B}',
    '7': '\u{1F30A}', '8': '\u{1F988}', '9': '\u{1F451}',
    '10': '\u{1F419}',
  },
  pieceImages: {
    'F': '/images/pirate/treasure-chest.png',
    'B': '/images/pirate/sea-mine.png',
    '0': '/images/pirate/stowaway.png',
    '1': '/images/pirate/watchman.png',
    '2': '/images/pirate/parrot.png',
    '3': '/images/pirate/diver.png',
    '4': '/images/pirate/crewmate.png',
    '5': '/images/pirate/buccaneer.png',
    '6': '/images/pirate/musketeer.png',
    '7': '/images/pirate/shark-rider.png',
    '8': '/images/pirate/megalodon.png',
    '9': '/images/pirate/pirate-king.png',
    '10': '/images/pirate/kraken.png',
  },
  enemyPieceImage: '/images/pirate/enemy-piece.png',
  board: {
    lightSquare: '#c4a36e',
    darkSquare: '#6b4226',
    lakeName: 'Whirlpool',
    lakeClass: 'lake-whirlpool',
    playerColors: { 1: '#8b1a1a', 2: '#1a1a6b' },
    playerBg: { 1: 'from-[#8b1a1a]/90 to-[#4a0e0e]/90', 2: 'from-[#1a1a6b]/90 to-[#0e0e3a]/90' },
    playerBorder: { 1: 'border-[#c44]/50', 2: 'border-[#44c]/50' },
    backgroundClass: 'theme-pirate-board',
    lakeAnimationClass: 'lake-whirlpool-animated',
  },
  flavor: {
    setupTitle: 'Man Your Fleet',
    yourTurn: 'Set Sail, Captain',
    waiting: 'The enemy charts their course...',
    win: 'The Treasure is Yours!',
    lose: "Ye've Been Sunk...",
  },
  revealTitles: {
    combat: 'COMBAT!',
    scout_move: 'PARROT SPOTTED!',
    spy_kills_marshal: 'STOWAWAY STRIKE!',
    miner_defuses_bomb: 'MINE DEFUSED!',
    spotter_reveal: 'WATCHMAN PREDICTION!',
  },
  pieceReference: {
    flagDesc: 'Treasure Chest \u2014 Immovable. Capture = win',
    bombDesc: 'Sea Mine \u2014 Immovable. Destroys attackers',
    spyDesc: 'Stowaway \u2014 Kills Kraken if attacking',
    spotterDesc: 'Watchman \u2014 Predict enemy rank',
    scoutDesc: 'Parrot \u2014 Moves in straight lines',
    minerDesc: 'Diver \u2014 Defuses Sea Mines',
    midTier: 'Standard combat pieces',
    highOfficers: 'Higher officers',
    generalDesc: 'Pirate King',
    marshalDesc: 'Kraken \u2014 Highest rank',
    combatRule: 'Higher rank wins in combat. Equal = both die.',
  },
};

const GREEK_THEME: Theme = {
  id: 'greek',
  name: 'Greek',
  icon: '\u26A1',
  pieceNames: {
    'F': "Pandora's Box", 'B': 'Medusa Stone', '0': 'Kronos',
    '1': 'The Oracle', '2': 'Pegasus', '3': 'Hephaestus',
    '4': 'Centaur', '5': 'Ares', '6': 'Apollo',
    '7': 'Athena', '8': 'Hades', '9': 'Poseidon',
    '10': 'Zeus',
  },
  pieceEmojis: {
    'F': '\u{1F4E6}', 'B': '\u{1F40D}', '0': '\u231B',
    '1': '\u{1F441}\uFE0F', '2': '\u{1FABD}', '3': '\u{1F525}',
    '4': '\u{1F434}', '5': '\u2694\uFE0F', '6': '\u2600\uFE0F',
    '7': '\u{1F989}', '8': '\u{1F480}', '9': '\u{1F531}',
    '10': '\u26A1',
  },
  pieceImages: {
    'F': '/images/greek/pandoras-box.png',
    'B': '/images/greek/medusa-stone.png',
    '0': '/images/greek/kronos.png',
    '1': '/images/greek/oracle.png',
    '2': '/images/greek/pegasus.png',
    '3': '/images/greek/hephaestus.png',
    '4': '/images/greek/centaur.png',
    '5': '/images/greek/ares.png',
    '6': '/images/greek/apollo.png',
    '7': '/images/greek/athena.png',
    '8': '/images/greek/hades.png',
    '9': '/images/greek/poseidon.png',
    '10': '/images/greek/zeus.png',
  },
  enemyPieceImage: '/images/greek/enemy-piece.png',
  board: {
    lightSquare: '#2a3a5c',
    darkSquare: '#1a2844',
    lakeName: 'River Styx',
    lakeClass: 'lake-styx',
    playerColors: { 1: '#8b7a2e', 2: '#1a3a6b' },
    playerBg: { 1: 'from-[#8b7a2e]/90 to-[#4a3e0e]/90', 2: 'from-[#1a3a6b]/90 to-[#0e1a3a]/90' },
    playerBorder: { 1: 'border-[#c4a42e]/50', 2: 'border-[#4488cc]/50' },
    backgroundClass: 'theme-greek-board',
    lakeAnimationClass: 'lake-styx-animated',
  },
  flavor: {
    setupTitle: 'Summon Your Champions',
    yourTurn: 'The Gods Await Your Command',
    waiting: 'Your rival consults the fates...',
    win: 'Olympus Bows to You!',
    lose: 'The Gods Have Forsaken You...',
  },
  revealTitles: {
    combat: 'COMBAT!',
    scout_move: 'PEGASUS SPOTTED!',
    spy_kills_marshal: 'KRONOS STRIKES!',
    miner_defuses_bomb: 'STONE SHATTERED!',
    spotter_reveal: 'ORACLE VISION!',
  },
  pieceReference: {
    flagDesc: "Pandora's Box \u2014 Immovable. Capture = win",
    bombDesc: 'Medusa Stone \u2014 Immovable. Destroys attackers',
    spyDesc: 'Kronos \u2014 Kills Zeus if attacking',
    spotterDesc: 'The Oracle \u2014 Predict enemy rank',
    scoutDesc: 'Pegasus \u2014 Moves in straight lines',
    minerDesc: 'Hephaestus \u2014 Defuses Medusa Stones',
    midTier: 'Standard combat pieces',
    highOfficers: 'Higher officers',
    generalDesc: 'Poseidon',
    marshalDesc: 'Zeus \u2014 Highest rank',
    combatRule: 'Higher rank wins in combat. Equal = both die.',
  },
};

const THEMES: Record<ThemeId, Theme> = {
  kingdom: KINGDOM_THEME,
  pirate: PIRATE_THEME,
  greek: GREEK_THEME,
};

export const THEME_LIST: Theme[] = [KINGDOM_THEME, PIRATE_THEME, GREEK_THEME];

export function getTheme(id: ThemeId): Theme {
  return THEMES[id];
}

export const DEFAULT_THEME_ID: ThemeId = 'kingdom';
