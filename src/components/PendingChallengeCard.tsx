import React from 'react';
import { Challenge, Player } from '../types';
import { Swords } from 'lucide-react';

interface PendingChallengeCardProps {
  challenge: Challenge;
  challenger: Player;
  defender: Player;
  onRespond: (challenge: Challenge) => void;
}

const PendingChallengeCard: React.FC<PendingChallengeCardProps> = ({
  challenge,
  challenger,
  defender,
  onRespond
}) => {
  const formattedDate = new Date(challenge.date).toLocaleDateString();
  const responseDeadline = new Date(challenge.responseDeadline);
  const daysLeft = Math.max(0, Math.ceil((responseDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  
  const isChallenger = challenge.status === 'pending' && challenge.challengerId === challenger.id;
  const isDefender = challenge.status === 'pending' && challenge.defenderId === defender.id;
  
  return (
    <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4 mb-4 shadow-md">
      <div className="flex items-center mb-2">
        <Swords className="text-amber-600 mr-2 h-5 w-5" />
        <h3 className="text-md font-semibold text-amber-800">
          {isChallenger ? 'Your Challenge' : 'Challenge For Your Position'}
        </h3>
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <div className="flex flex-col items-center mr-4 bg-white px-2 py-1 rounded border border-amber-200">
            <span className="text-xs text-gray-500">Challenger</span>
            <span className="font-semibold">{challenger.name}</span>
            <span className="text-xs">Position #{challenger.position}</span>
          </div>
          <div className="text-center mx-2">
            <span className="text-xl font-bold text-amber-600">vs</span>
          </div>
          <div className="flex flex-col items-center ml-4 bg-white px-2 py-1 rounded border border-amber-200">
            <span className="text-xs text-gray-500">Defender</span>
            <span className="font-semibold">{defender.name}</span>
            <span className="text-xs">Position #{defender.position}</span>
          </div>
        </div>
      </div>
      
      <div className="text-sm mt-2">
        <p><span className="font-medium">Challenge Date:</span> {formattedDate}</p>
        <p className="flex items-center mt-1">
          <span className="font-medium">Response Needed:</span> 
          <span className={`ml-1 ${daysLeft <= 1 ? 'text-red-600 font-bold' : 'text-amber-700'}`}>
            {daysLeft === 0 ? 'Today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
          </span>
        </p>
      </div>
      
      {isDefender && (
        <div className="mt-3 bg-blue-50 p-2 rounded text-xs border border-blue-100">
          <span className="font-semibold text-blue-800">Remember: </span>
          <span className="text-blue-700">If you win, you'll gain +1 life. If you lose, you'll lose 1 life and your position.</span>
        </div>
      )}
      
      {isChallenger && (
        <div className="mt-3 bg-blue-50 p-2 rounded text-xs border border-blue-100">
          <span className="font-semibold text-blue-800">Your challenge is pending. </span>
          <span className="text-blue-700">You've used 1 life to issue this challenge.</span>
        </div>
      )}
      
      {isDefender && (
        <button 
          onClick={() => onRespond(challenge)}
          className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md font-medium text-sm transition-colors"
        >
          Respond to Challenge
        </button>
      )}
    </div>
  );
};

export default PendingChallengeCard;
