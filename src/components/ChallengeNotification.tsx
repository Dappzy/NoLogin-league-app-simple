import React from 'react';
import { Challenge } from '../types';
import { AlertCircle } from 'lucide-react';

interface ChallengeNotificationProps {
  challenge: Challenge;
  onAccept: (challenge: Challenge) => void;
  onDecline: (challenge: Challenge) => void;
  onCancel: () => void;
}

const ChallengeNotification: React.FC<ChallengeNotificationProps> = ({
  challenge,
  onAccept,
  onDecline,
  onCancel
}) => {
  const formattedDate = new Date(challenge.date).toLocaleDateString();
  const responseDeadline = new Date(challenge.responseDeadline).toLocaleDateString();
  
  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-6 w-6 text-yellow-500" />
        </div>
        <div className="ml-3 w-full">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            New Challenge!
          </h3>
          <div className="mt-2 text-sm text-gray-600">
            <p className="mb-1"><strong>Challenge Date:</strong> {formattedDate}</p>
            <p className="mb-1"><strong>Response Needed By:</strong> {responseDeadline}</p>
            <p className="font-bold mt-3 text-yellow-700">
              Do you accept this challenge to defend your position?
            </p>
            <p className="mt-1 text-xs bg-blue-50 p-2 rounded border border-blue-100">
              <span className="font-semibold">Important:</span> If you win this match, you'll gain +1 life. 
              If you lose, you'll lose 1 life and your current position.
            </p>
          </div>
          <div className="mt-4 flex justify-between">
            <button
              onClick={() => onAccept(challenge)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Accept Challenge
            </button>
            <button
              onClick={() => onDecline(challenge)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Decline Challenge
            </button>
            <button
              onClick={onCancel}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeNotification;
