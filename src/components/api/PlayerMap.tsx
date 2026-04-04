'use client';

import { PlayerCoords } from '@/types/api';
import { ThemeId, getTheme } from '@/lib/themes';
import { coordsToMapPosition, calculateDistance, formatDistance } from '@/lib/apis/geolocation';

interface PlayerMapProps {
  player1: PlayerCoords | null;
  player2: PlayerCoords | null;
  theme: ThemeId;
}

const MAP_WIDTH = 250;
const MAP_HEIGHT = 150;

// Simplified continent outlines for a mini world map (equirectangular projection)
const CONTINENT_PATHS = [
  // North America
  'M30,35 L55,25 L70,30 L75,45 L65,55 L55,65 L40,60 L30,50 Z',
  // South America
  'M55,68 L65,65 L70,75 L68,95 L60,105 L50,95 L48,80 Z',
  // Europe
  'M115,30 L130,25 L135,35 L128,45 L118,42 L115,35 Z',
  // Africa
  'M115,50 L135,48 L140,60 L138,80 L130,95 L118,90 L112,70 L110,58 Z',
  // Asia
  'M135,20 L175,15 L195,25 L200,40 L190,50 L170,55 L155,50 L140,45 L135,30 Z',
  // Australia
  'M185,80 L205,78 L210,88 L200,95 L188,92 Z',
];

export default function PlayerMap({ player1, player2, theme }: PlayerMapProps) {
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
        className="rounded-lg border border-stone-700/50 bg-stone-900/80"
      >
        {/* Continent outlines */}
        {CONTINENT_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="rgba(120, 113, 100, 0.25)"
            stroke="rgba(120, 113, 100, 0.4)"
            strokeWidth={0.5}
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

      {/* Distance label or status */}
      <div className="text-xs text-stone-400 text-center">
        {distance !== null ? (
          <span>Battling across {formatDistance(distance)}</span>
        ) : !player1 && !player2 ? (
          <span>Location hidden</span>
        ) : !player1 ? (
          <span>Your location hidden</span>
        ) : !player2 ? (
          <span>Opponent location hidden</span>
        ) : null}
      </div>
    </div>
  );
}
