import { ThemeId } from '@/lib/themes';

export type NotificationEvent =
  | 'your_turn'
  | 'piece_killed'
  | 'opponent_disconnected'
  | 'opponent_reconnected';

interface NotificationContent {
  title: string;
  body: string;
}

interface NotificationDetails {
  pieceName?: string;
}

type ContentMap = Record<ThemeId, NotificationContent | ((details: NotificationDetails) => NotificationContent)>;

const NOTIFICATION_CONTENT: Record<NotificationEvent, ContentMap> = {
  your_turn: {
    kingdom: { title: 'Your Majesty!', body: 'The enemy has moved. Your kingdom awaits your command.' },
    pirate: { title: 'Captain!', body: 'The enemy has made their move. Set sail!' },
    greek: { title: 'Champion!', body: 'The gods grow restless. It is your turn.' },
  },
  piece_killed: {
    kingdom: (d) => ({ title: 'Casualty Report', body: `Your ${d.pieceName} has fallen in battle.` }),
    pirate: (d) => ({ title: 'Man Overboard!', body: `Your ${d.pieceName} has been lost to the sea.` }),
    greek: (d) => ({ title: 'The Fates Have Spoken', body: `Your ${d.pieceName} has been struck down.` }),
  },
  opponent_disconnected: {
    kingdom: { title: 'Opponent Disconnected', body: 'Your opponent has left. Waiting for reconnection...' },
    pirate: { title: 'Opponent Disconnected', body: 'Your opponent has left. Waiting for reconnection...' },
    greek: { title: 'Opponent Disconnected', body: 'Your opponent has left. Waiting for reconnection...' },
  },
  opponent_reconnected: {
    kingdom: { title: 'Opponent Returned', body: 'The battle resumes!' },
    pirate: { title: 'Opponent Returned', body: 'The battle resumes!' },
    greek: { title: 'Opponent Returned', body: 'The battle resumes!' },
  },
};

export function getNotificationContent(
  theme: ThemeId,
  event: NotificationEvent,
  details?: NotificationDetails,
): NotificationContent {
  const entry = NOTIFICATION_CONTENT[event]?.[theme];
  if (!entry) return { title: '', body: '' };
  return typeof entry === 'function' ? entry(details ?? {}) : entry;
}
