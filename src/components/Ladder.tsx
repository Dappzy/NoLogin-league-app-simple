import React from 'react';
import { Swords, Trophy, Clock, AlertCircle, Heart } from 'lucide-react';
import type { Player, Challenge } from '../types';

interface LadderProps {
  players: Player[];
  challenges: Challenge[];
  onChallenge: (player: Player) => void;
  onRespond: (challenge: Challenge, accept: boolean) => void;
}

export const Ladder: React.FC<LadderProps> = ({ 
  players, 
  challenges, 
  onChallenge,
  onRespond 
}) => {
  const getPlayerChallenges = (playerId: string) => {
    return challenges.filter(
      c => c.challengerId === playerId || c.defenderId === playerId
    );
  };

  const getTimeRemaining = (deadline: string) => {
    const hours = Math.max(0, Math.floor(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60)
    ));
    return `${hours}h remaining`;
  };

  const renderLives = (lives: number) => {
    return Array(lives).fill(0).map((_, i) => (
      <Heart 
        key={i} 
        className="w-4 h-4 text-red-500 fill-current" 
      />
    ));
  };

  return (
    <div className="space-y-4">
      {players.map((player, index) => {
        const playerChallenges = getPlayerChallenges(player.id);
        const isInChallenge = playerChallenges.some(c => c.status === 'pending');
        const incomingChallenges = challenges.filter(
          c => c.defenderId === player.id && c.status === 'pending'
        );
        const canChallenge = player.lives > 0 && player.weeklyMatches < 2;
        
        return (
          <div 
            key={player.id}
            className={`
              bg-white rounded-lg shadow-md p-4
              ${index === 0 ? 'border-2 border-yellow-400' : ''}
              ${player.challengesDeclined >= 3 ? 'border-2 border-red-400' : ''}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-green-800">
                  #{player.position}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg">{player.name}</span>
                    {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                    <div className="flex items-center space-x-1">
                      {renderLives(player.lives)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Rank: {player.rank} • W/L: {player.matchesWon}/{player.matchesLost}
                    • Weekly Matches: {player.weeklyMatches}/2
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Incoming Challenges */}
                {incomingChallenges.map((challenge) => {
                  const challenger = players.find(p => p.id === challenge.challengerId);
                  return (
                    <div key={challenge.id} className="flex items-center space-x-2">
                      <div className="text-sm bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <span>Challenge from #{challenger?.position}</span>
                          <Clock className="w-4 h-4" />
                          <span>{getTimeRemaining(challenge.responseDeadline)}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onRespond(challenge, true)}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => onRespond(challenge, false)}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Outgoing Challenges */}
                {playerChallenges
                  .filter(c => c.challengerId === player.id && c.status === 'pending')
                  .map((challenge) => (
                    <div 
                      key={challenge.id}
                      className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center space-x-2"
                    >
                      <span>Challenging #{
                        players.find(p => p.id === challenge.defenderId)?.position
                      }</span>
                      <Clock className="w-4 h-4" />
                      <span>{getTimeRemaining(challenge.responseDeadline)}</span>
                    </div>
                  ))
                }
                
                {!isInChallenge && index !== 0 && (
                  <button
                    onClick={() => onChallenge(player)}
                    disabled={!canChallenge}
                    className={`
                      px-4 py-2 rounded-md flex items-center space-x-2
                      ${canChallenge 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                    `}
                  >
                    <Swords className="w-4 h-4" />
                    <span>Challenge {!canChallenge ? '(No lives/Max matches)' : ''}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};