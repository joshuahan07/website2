'use client';

import { PlayerCoords } from '@/types/api';
import { ThemeId, getTheme } from '@/lib/themes';
import { coordsToMapPosition, calculateDistance, formatDistance } from '@/lib/apis/geolocation';

interface PlayerMapProps {
  player1: PlayerCoords | null;
  player2: PlayerCoords | null;
  theme: ThemeId;
  isLoading?: boolean;
  player1City?: string | null;
  player2City?: string | null;
  player1Weather?: string | null;
  player2Weather?: string | null;
}

const MAP_WIDTH = 250;
const MAP_HEIGHT = 150;

// More detailed continent outlines (equirectangular projection, 250x150)
const CONTINENT_PATHS = [
  // North America
  'M22,38 L28,32 L38,28 L48,24 L56,22 L64,24 L72,28 L76,34 L78,42 L74,48 L70,52 L64,56 L56,62 L48,64 L42,60 L36,56 L30,50 L24,44 Z',
  // Central America
  'M48,64 L52,66 L54,70 L52,72 L48,70 Z',
  // South America
  'M52,74 L60,70 L66,72 L70,78 L72,86 L70,96 L66,104 L60,108 L54,104 L50,96 L48,86 L48,78 Z',
  // Europe
  'M112,28 L118,24 L124,22 L130,24 L134,28 L136,34 L132,38 L128,42 L122,44 L116,42 L112,36 Z',
  // Africa
  'M110,50 L118,46 L126,44 L134,46 L140,52 L142,62 L140,74 L136,84 L130,92 L124,96 L118,94 L112,88 L108,78 L106,66 L108,56 Z',
  // Middle East
  'M136,38 L142,36 L148,38 L152,44 L148,48 L142,50 L136,46 Z',
  // Asia
  'M140,18 L152,14 L164,12 L176,14 L188,18 L196,24 L200,32 L198,40 L192,48 L184,52 L176,54 L168,52 L160,50 L152,48 L146,44 L140,38 L138,28 Z',
  // India
  'M160,50 L166,52 L170,60 L166,68 L160,66 L156,58 Z',
  // Southeast Asia
  'M184,52 L190,54 L194,60 L190,64 L186,60 Z',
  // Japan/Korea
  'M200,28 L204,26 L206,30 L204,34 L200,32 Z',
  // Australia
  'M186,78 L196,74 L206,76 L212,82 L210,90 L204,96 L196,96 L190,92 L186,86 Z',
  // New Zealand
  'M214,94 L216,90 L218,94 L216,98 Z',
  // Greenland
  'M68,14 L78,10 L86,12 L84,20 L76,22 L70,20 Z',
  // UK/Ireland
  'M108,26 L112,24 L114,28 L112,32 L108,30 Z',
];

export default function PlayerMap({ player1, player2, theme, isLoading, player1City, player2City, player1Weather, player2Weather }: PlayerMapProps) {
  const t = getTheme(theme);
  const color1 = t.board.playerColors[1];
  const color2 = t.board.playerColors[2];

  const pos1 = player1
    ? coordsToMapPosition(player1.latitude, player1.longitude, MAP_WIDTH, MAP_HEIGHT)
    : null;
  const pos2 = player2
    ? coordsToMapPosition(player2.latitude, player2.longitude, MAP_WIDTH, MAP_HEIGHT)
    : null;

  const distance =
    player1 && player2
      ? calculateDistance(
          player1.latitude,
          player1.longitude,
          player2.latitude,
          player2.longitude
        )
      : null;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="rounded-lg border border-white/[0.06] overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0c1220 0%, #0a1628 50%, #0d1a2d 100%)' }}
      >
        {/* Ocean grid lines */}
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 25} x2={MAP_WIDTH} y2={i * 25} stroke="rgba(59,130,246,0.06)" strokeWidth={0.5} />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`v${i}`} x1={i * 25} y1={0} x2={i * 25} y2={MAP_HEIGHT} stroke="rgba(59,130,246,0.06)" strokeWidth={0.5} />
        ))}

        {/* Continent fills */}
        {CONTINENT_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="rgba(34, 197, 94, 0.12)"
            stroke="rgba(34, 197, 94, 0.25)"
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        ))}

        {/* Dashed line connecting players */}
        {pos1 && pos2 && (
          <>
            <style>{`
              @keyframes dash-scroll {
                to { stroke-dashoffset: -12; }
              }
            `}</style>
            <line
              x1={pos1.x}
              y1={pos1.y}
              x2={pos2.x}
              y2={pos2.y}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={1}
              strokeDasharray="4 4"
              style={{ animation: 'dash-scroll 1s linear infinite' }}
            />
          </>
        )}

        {/* Player 1 dot */}
        {pos1 && (
          <>
            <style>{`
              @keyframes pulse-1 {
                0%, 100% { r: 4; opacity: 1; }
                50% { r: 6; opacity: 0.7; }
              }
            `}</style>
            <circle
              cx={pos1.x}
              cy={pos1.y}
              r={4}
              fill={color1}
              stroke="white"
              strokeWidth={1}
              style={{ animation: 'pulse-1 2s ease-in-out infinite' }}
            />
          </>
        )}

        {/* Player 2 dot */}
        {pos2 && (
          <>
            <style>{`
              @keyframes pulse-2 {
                0%, 100% { r: 4; opacity: 1; }
                50% { r: 6; opacity: 0.7; }
              }
            `}</style>
            <circle
              cx={pos2.x}
              cy={pos2.y}
              r={4}
              fill={color2}
              stroke="white"
              strokeWidth={1}
              style={{ animation: 'pulse-2 2s ease-in-out infinite 0.5s' }}
            />
          </>
        )}
      </svg>

      {/* City names + weather */}
      {(player1City || player2City) && (
        <div className="text-[10px] text-stone-500 text-center leading-relaxed">
          {player1City && player2City
            ? <span>{player1City} vs {player2City}</span>
            : <span>{player1City || player2City}</span>
          }
          {(player1Weather || player2Weather) && (
            <div className="text-[9px] text-stone-600">
              {player1Weather && player2Weather
                ? <span>{player1Weather} vs {player2Weather}</span>
                : <span>{player1Weather || player2Weather}</span>
              }
            </div>
          )}
        </div>
      )}
      {/* Distance label or status */}
      <div className="text-xs text-stone-400 text-center">
        {distance !== null ? (
          <span>Battling across {formatDistance(distance)}</span>
        ) : isLoading ? (
          <span className="animate-pulse">Locating...</span>
        ) : !player1 && !player2 ? (
          <span>Location unavailable</span>
        ) : !player1 ? (
          <span>Your location hidden</span>
        ) : !player2 ? (
          <span>Opponent location hidden</span>
        ) : null}
      </div>
    </div>
  );
}
