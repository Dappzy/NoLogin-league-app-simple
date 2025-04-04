import React from 'react';
import { Player } from '../types';
import { Trophy, Swords } from 'lucide-react';

interface PyramidProps {
  players: Player[];
  onChallenge: (challengerId: string, defenderId: string) => void;
}

export const Pyramid: React.FC<PyramidProps> = ({ players, onChallenge }) => {
  const tiers = [1, 2, 3, 4, 5];
  
  const getPlayersInTier = (tier: number) => {
    return players.filter(player => player.tier === tier);
  };

  const renderPlayerCard = (player: Player) => (
    <div 
      key={player.id}
      className="bg-white rounded-lg shadow-lg p-4 mx-2 mb-4 w-48 transform hover:scale-105 transition-transform"
    >
      <div className="text-center">
        <div className="font-bold text-lg mb-1">{player.name}</div>
        <div className="text-sm text-gray-600">Rank {player.rank}</div>
        <div className="text-sm text-gray-600">
          W/L: {player.matchesWon}/{player.matchesLost}
        </div>
        {player.currentStreak > 0 && (
          <div className="text-sm text-green-600">
            Streak: {player.currentStreak}
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-center">
        <button
          onClick={() => onChallenge(player.id, player.position.toString())}
          className="bg-green-700 text-white px-3 py-1 rounded-full text-sm hover:bg-green-800 transition-colors flex items-center"
        >
          <Swords className="w-4 h-4 mr-1" />
          Challenge
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      {tiers.map(tier => (
        <div 
          key={tier}
          className={`flex justify-center items-center
            ${tier === 1 ? 'w-48' : 
              tier === 2 ? 'w-96' : 
              tier === 3 ? 'w-full max-w-3xl' :
              tier === 4 ? 'w-full max-w-4xl' :
              'w-full max-w-5xl'}`}
        >
          {tier === 1 && (
            <div className="absolute -top-6">
              <Trophy className="w-12 h-12 text-yellow-500" />
            </div>
          )}
          <div className="flex flex-wrap justify-center">
            {getPlayersInTier(tier).map(player => renderPlayerCard(player))}
          </div>
        </div>
      ))}
    </div>
  );
};