import React from 'react';
import { Heart, Info, AlertCircle } from 'lucide-react';
import { Player } from '../types';

interface ChallengeInfoProps {
  currentUser: Player | null;
}

const ChallengeInfo: React.FC<ChallengeInfoProps> = ({ currentUser }) => {
  if (!currentUser) return null;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h2 className="text-lg font-semibold flex items-center text-green-800 mb-2">
        <Info className="mr-2 w-5 h-5" />
        Challenge System Information
      </h2>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-start">
          <div className="flex items-center text-red-500 mr-2">
            <Heart className="w-4 h-4 mr-1" fill="currentColor" />
            <span className="font-bold">{currentUser.lives}</span>
          </div>
          <div>
            <p className="text-gray-700">
              You currently have <span className="font-bold">{currentUser.lives}</span> lives.
              {currentUser.lives === 0 && (
                <span className="text-red-500 font-bold"> You need to successfully defend your position to gain a life!</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-yellow-700 mr-2 flex-shrink-0" />
            <div>
              <p className="text-yellow-700">
                <span className="font-bold">Important:</span> Issuing a challenge costs 1 life.
                Accepting a challenge gives you +1 life (maximum 5 lives) regardless of whether you win or lose.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeInfo;
