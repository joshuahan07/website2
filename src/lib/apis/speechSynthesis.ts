import { ThemeId } from '@/lib/themes';
import { GameEventType, EventDetails } from '@/types/api';

type NarrationMap = Record<ThemeId, string | ((details: EventDetails) => string)>;

const NARRATIONS: Record<GameEventType, NarrationMap> = {
  combat_kill: {
    kingdom: (d) => `The ${d.winnerPiece} has slain the ${d.loserPiece}! The battlefield trembles.`,
    pirate: (d) => `The ${d.winnerPiece} sends the ${d.loserPiece} to Davy Jones' locker!`,
    greek: (d) => `The ${d.winnerPiece} has struck down the ${d.loserPiece}! The gods bear witness.`,
  },
  spy_kills_marshal: {
    kingdom: 'The Assassin emerges from the shadows and strikes down the King! Treachery!',
    pirate: 'The Stowaway reveals themselves and drags the Kraken to the depths!',
    greek: "Kronos rises from the abyss! Zeus falls to his father's vengeance!",
  },
  miner_defuses_bomb: {
    kingdom: 'The Blacksmith dismantles the Spike Pit with expert precision.',
    pirate: 'The Diver carefully disarms the Sea Mine beneath the waves.',
    greek: 'Hephaestus shatters the Medusa Stone in his divine forge.',
  },
  spotter_correct: {
    kingdom: (d) => `The Tower Guard's keen eye reveals the truth! The ${d.piece} is exposed and destroyed!`,
    pirate: (d) => `The Watchman calls it from the crow's nest! The ${d.piece} is identified and eliminated!`,
    greek: (d) => `The Oracle's vision is true! The ${d.piece} is unveiled and vanquished!`,
  },
  spotter_wrong: {
    kingdom: 'The Tower Guard squints... but sees nothing. The enemy remains hidden.',
    pirate: 'The Watchman peers through the fog... wrong call, Captain.',
    greek: "The Oracle's vision clouds... the fates remain silent.",
  },
  scout_long_move: {
    kingdom: 'The Horseman gallops across the field!',
    pirate: 'The Parrot soars across the deck!',
    greek: 'Pegasus takes flight across the battlefield!',
  },
  flag_captured: {
    kingdom: 'The Princess has been captured! The kingdom falls! All hail the conqueror!',
    pirate: 'The Treasure Chest is seized! The seas belong to the victor!',
    greek: "Pandora's Box is taken! Olympus crumbles! A new god rises!",
  },
  turn_start_yours: {
    kingdom: 'Your move, Your Majesty.',
    pirate: 'Set sail, Captain.',
    greek: 'The gods await your command.',
  },
  turn_start_opponent: {
    kingdom: 'The enemy considers their next strike.',
    pirate: 'The enemy charts their course.',
    greek: 'Your rival consults the fates.',
  },
  equal_rank: {
    kingdom: 'Steel meets steel! Both warriors fall!',
    pirate: 'A clash on the high seas! Both sink beneath the waves!',
    greek: 'The gods collide! Both are cast into the underworld!',
  },
};

export function getNarration(
  theme: ThemeId,
  event: GameEventType,
  details: EventDetails,
): string {
  const entry = NARRATIONS[event]?.[theme];
  if (!entry) return '';
  return typeof entry === 'function' ? entry(details) : entry;
}
