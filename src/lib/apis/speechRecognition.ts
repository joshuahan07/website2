import { ThemeId, getTheme } from '@/lib/themes';
import { GameCommand } from '@/types/api';
import { Rank } from '@/types/game';

const COLUMNS = 'ABCDEFGHIJ';
const MAX_ROW = 8;

const THEME_IDS: ThemeId[] = ['kingdom', 'pirate', 'greek'];

function parseCoordinate(token: string): { col: number; row: number } | null {
  const match = token.match(/^([a-jA-J])(\d)$/);
  if (!match) return null;
  const col = COLUMNS.indexOf(match[1].toUpperCase());
  const row = parseInt(match[2], 10);
  if (col < 0 || row < 1 || row > MAX_ROW) return null;
  return { col, row };
}

function coordToString(coord: { col: number; row: number }): string {
  return `${COLUMNS[coord.col]}${coord.row}`;
}

function buildPieceNameMap(theme: ThemeId): Map<string, Rank> {
  const t = getTheme(theme);
  const map = new Map<string, Rank>();
  for (const [rank, name] of Object.entries(t.pieceNames)) {
    map.set(name.toLowerCase(), rank as Rank);
  }
  return map;
}

function findPieceName(
  words: string[],
  startIndex: number,
  nameMap: Map<string, Rank>,
): { rank: Rank; name: string; endIndex: number } | null {
  // Try matching 3-word, 2-word, then 1-word piece names from startIndex
  for (let len = 3; len >= 1; len--) {
    if (startIndex + len > words.length) continue;
    const candidate = words.slice(startIndex, startIndex + len).join(' ');
    const rank = nameMap.get(candidate);
    if (rank !== undefined) {
      return { rank, name: candidate, endIndex: startIndex + len };
    }
  }

  // Try partial matching: check if any piece name starts with the candidate
  for (let len = 1; len <= Math.min(3, words.length - startIndex); len++) {
    const candidate = words.slice(startIndex, startIndex + len).join(' ');
    for (const [name, rank] of Array.from(nameMap.entries())) {
      if (name.startsWith(candidate) && candidate.length >= 3) {
        return { rank, name, endIndex: startIndex + len };
      }
    }
  }

  return null;
}

// Common speech-to-text misinterpretations
const MISHEARD_WORDS: Record<string, string> = {
  'before': 'b4', 'beef or': 'b4', 'be for': 'b4',
  'see': 'c', 'sea': 'c',
  'dee': 'd', 'the': 'd',
  'ee': 'e',
  'ef': 'f', 'eff': 'f',
  'gee': 'g', 'ji': 'g', 'jee': 'g',
  'aitch': 'h', 'age': 'h', 'ache': 'h', 'each': 'h',
  'eye': 'i', 'aye': 'i',
  'jay': 'j',
};

const NUMBER_WORDS: Record<string, string> = {
  'one': '1', 'won': '1', 'two': '2', 'too': '2',
  'three': '3', 'tree': '3', 'free': '3',
  'four': '4', 'for': '4', 'fore': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'ate': '8',
};

function normalizeTranscript(raw: string): string {
  let text = raw;

  // 1. Replace full misheard coordinates like "before" -> "b4"
  for (const [misheard, correct] of Object.entries(MISHEARD_WORDS)) {
    if (correct.length > 1) {
      // Full coordinate replacement (e.g. "before" -> "b4")
      text = text.replace(new RegExp(`\\b${misheard}\\b`, 'gi'), correct);
    }
  }

  // 2. Replace misheard letter names followed by a number word or digit
  //    "see four" -> "c4", "jay 3" -> "j3", "eye eight" -> "i8"
  const letterPattern = Object.keys(MISHEARD_WORDS).filter(k => MISHEARD_WORDS[k].length === 1).join('|');
  const numPattern = Object.keys(NUMBER_WORDS).join('|');

  // misheard-letter + number-word: "see four" -> "c4"
  text = text.replace(new RegExp(`\\b(${letterPattern})\\s+(${numPattern})\\b`, 'gi'), (_, letter, num) => {
    const l = MISHEARD_WORDS[letter.toLowerCase()] || letter;
    const n = NUMBER_WORDS[num.toLowerCase()] || num;
    return `${l}${n}`;
  });

  // misheard-letter + digit: "see 4" -> "c4"
  text = text.replace(new RegExp(`\\b(${letterPattern})\\s+(\\d)\\b`, 'gi'), (_, letter, num) => {
    const l = MISHEARD_WORDS[letter.toLowerCase()] || letter;
    return `${l}${num}`;
  });

  // 3. Real letter + number-word: "b four" -> "b4", "a one" -> "a1"
  //    But NOT "to" as number word (it's the separator)
  text = text.replace(/\b([a-jA-J])\s+(one|won|two|too|three|tree|free|four|fore|five|six|seven|eight|ate)\b/gi, (_, letter, num) => {
    return `${letter}${NUMBER_WORDS[num.toLowerCase()] || num}`;
  });

  // 4. Real letter + space + digit: "i 3" -> "i3"
  text = text.replace(/\b([a-jA-J])\s+(\d)\b/g, '$1$2');

  return text;
}

export function parseCommand(transcript: string, theme: ThemeId): GameCommand | null {
  const raw = normalizeTranscript(transcript.trim().toLowerCase());
  if (!raw) return null;

  // Cancel commands
  if (/^(cancel|nevermind|never mind)$/.test(raw)) {
    return { type: 'cancel' };
  }

  // Ready commands
  if (/^(ready|i'm ready|im ready|i am ready)$/.test(raw)) {
    return { type: 'ready' };
  }

  // Theme switch commands
  for (const tid of THEME_IDS) {
    if (
      raw === `switch to ${tid}` ||
      raw === `${tid} theme` ||
      raw === `change to ${tid}` ||
      raw === `use ${tid}` ||
      raw === `set theme ${tid}`
    ) {
      return { type: 'theme', theme: tid };
    }
  }

  const nameMap = buildPieceNameMap(theme);
  const words = raw.split(/\s+/);

  // Predict / guess commands: "predict archer", "guess king", "i think it's the blacksmith"
  const predictMatch = raw.match(/^(?:predict|guess|i think (?:it's |its )?(?:the |a )?)/);
  if (predictMatch) {
    const afterPrefix = raw.slice(predictMatch[0].length).trim();
    const afterWords = afterPrefix.split(/\s+/).filter(Boolean);
    if (afterWords.length > 0) {
      const piece = findPieceName(afterWords, 0, nameMap);
      if (piece) {
        const t = getTheme(theme);
        return { type: 'predict', prediction: t.pieceNames[piece.rank] };
      }
    }
    return null;
  }

  // Attack commands: "attack D7" or "horseman attack D7"
  const attackIndex = words.indexOf('attack');
  if (attackIndex !== -1) {
    // Look for coordinate after "attack"
    const coordAfter = attackIndex + 1 < words.length ? parseCoordinate(words[attackIndex + 1]) : null;
    if (coordAfter) {
      // Check for piece name before "attack"
      const piece = attackIndex > 0 ? findPieceName(words, 0, nameMap) : null;
      const t = getTheme(theme);
      return {
        type: 'attack',
        piece: piece ? t.pieceNames[piece.rank] : undefined,
        to: coordToString(coordAfter),
      };
    }
    return null;
  }

  // Movement: "E3 to E5" (coordinate to coordinate)
  const toIndex = words.indexOf('to');
  if (toIndex !== -1) {
    const fromCoord = toIndex > 0 ? parseCoordinate(words[toIndex - 1]) : null;
    const toCoord = toIndex + 1 < words.length ? parseCoordinate(words[toIndex + 1]) : null;

    if (fromCoord && toCoord) {
      return {
        type: 'move',
        from: coordToString(fromCoord),
        to: coordToString(toCoord),
      };
    }

    // "Horseman to E5" (piece name to coordinate)
    if (toCoord) {
      const piece = findPieceName(words, 0, nameMap);
      if (piece && piece.endIndex <= toIndex) {
        const t = getTheme(theme);
        return {
          type: 'move',
          piece: t.pieceNames[piece.rank],
          to: coordToString(toCoord),
        };
      }
    }
  }

  // Movement: "move horseman E5" (no "to")
  if (words[0] === 'move' && words.length >= 3) {
    const piece = findPieceName(words, 1, nameMap);
    if (piece) {
      const coordToken = words[piece.endIndex];
      if (coordToken) {
        const coord = parseCoordinate(coordToken);
        if (coord) {
          const t = getTheme(theme);
          return {
            type: 'move',
            piece: t.pieceNames[piece.rank],
            to: coordToString(coord),
          };
        }
      }
    }

    // "move E3 E5"
    if (words.length >= 3) {
      const from = parseCoordinate(words[1]);
      const to = parseCoordinate(words[2]);
      if (from && to) {
        return {
          type: 'move',
          from: coordToString(from),
          to: coordToString(to),
        };
      }
    }
  }

  return null;
}
