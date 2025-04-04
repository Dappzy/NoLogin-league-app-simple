import React, { useState } from 'react';
import type { Player, Challenge } from '../types';

interface ChallengeModalProps {
  challenger: Player;
  players: Player[];
  onSubmit: (challenge: Challenge) => void;
  onClose: () => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  challenger,
  players,
  onSubmit,
  onClose,
}) => {
  const [selectedDefender, setSelectedDefender] = useState<string>('');

  // Top 5 players can only challenge 2 positions above, others can challenge 3 positions above
  const maxChallengePositions = challenger.position <= 5 ? 2 : 3;
  
  const availableDefenders = players.filter(p => 
    p.position < challenger.position && 
    p.position >= challenger.position - maxChallengePositions
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDefender) return;

    // Set response deadline to 24 hours from now
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 24);

    const challenge: Challenge = {
      id: Math.random().toString(36).substr(2, 9),
      challengerId: challenger.id,
      defenderId: selectedDefender,
      date: new Date().toISOString(),
      status: 'pending',
      responseDeadline: deadline.toISOString()
    };

    onSubmit(challenge);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Challenge a Player</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select player to challenge
            </label>
            <select
              value={selectedDefender}
              onChange={(e) => setSelectedDefender(e.target.value)}
              className="w-full border rounded-md p-2"
              required
            >
              <option value="">Select a player...</option>
              {availableDefenders.map(player => (
                <option key={player.id} value={player.id}>
                  #{player.position} - {player.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={!selectedDefender}
            >
              Submit Challenge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};