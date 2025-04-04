import { useState, useEffect } from 'react';
import { Ladder } from './components/Ladder';
import { ChallengeModal } from './components/ChallengeModal';
import { initialPlayers } from './data';
import { Trophy, Calendar, Users, Award, MessageSquare, Bell, Swords, X, Phone, ExternalLink, MessageCircle } from 'lucide-react';
import type { Player, Challenge, Match } from './types';

function App() {
  const [players, setPlayers] = useState(initialPlayers);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showRules, setShowRules] = useState(false);
  const daysRemaining = 75;

  const handleChallenge = (player: Player) => {
    if (player.lives === 0) {
      alert('You need at least 1 life to challenge!');
      return;
    }
    setSelectedPlayer(player);
  };

  const handleChallengeSubmit = (challenge: Challenge) => {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 24);
    
    const newChallenge: Challenge = {
      ...challenge,
      responseDeadline: deadline.toISOString(),
    };
    
    setChallenges([...challenges, newChallenge]);
    
    // Add notification
    const challenger = players.find(p => p.id === challenge.challengerId);
    const defender = players.find(p => p.id === challenge.defenderId);
    if (challenger && defender) {
      const notification = `${challenger.name} has challenged ${defender.name} for position #${defender.position}!`;
      setNotifications(prev => [notification, ...prev].slice(0, 10));
    }
    
    setSelectedPlayer(null);
  };

  const handleMatchComplete = (challenge: Challenge, winnerId: string) => {
    const updatedPlayers = [...players];
    const defender = updatedPlayers.find(p => p.id === challenge.defenderId);
    const challenger = updatedPlayers.find(p => p.id === challenge.challengerId);
    
    if (defender && challenger) {
      const date = new Date().toISOString();
      
      // Create match record
      const match: Match = {
        id: Math.random().toString(36).substr(2, 9),
        challengerId: challenger.id,
        defenderId: defender.id,
        date,
        completed: true,
        winnerId,
        score: "6-4, 7-5" // This should be input by the user in a real implementation
      };
      
      setMatches(prev => [match, ...prev]);
      
      // Defender wins
      if (winnerId === defender.id) {
        defender.lives = Math.min(5, defender.lives + 1); // Max 5 lives
        defender.matchesWon++;
        challenger.matchesLost++;
        
        if (defender.currentStreak < 0) defender.currentStreak = 1;
        else defender.currentStreak++;
        
        if (challenger.currentStreak > 0) challenger.currentStreak = -1;
        else challenger.currentStreak--;
        
        const notification = `${defender.name} successfully defended position #${defender.position} against ${challenger.name}! ${defender.name} gained 1 life (now has ${defender.lives}).`;
        setNotifications(prev => [notification, ...prev].slice(0, 10));
      } 
      // Challenger wins
      else {
        challenger.lives = Math.max(1, challenger.lives); // Ensure at least 1 life
        challenger.matchesWon++;
        defender.matchesLost++;
        
        // Defender still gains a life for accepting the challenge
        defender.lives = Math.min(5, defender.lives + 1);
        
        if (challenger.currentStreak < 0) challenger.currentStreak = 1;
        else challenger.currentStreak++;
        
        if (defender.currentStreak > 0) defender.currentStreak = -1;
        else defender.currentStreak--;
        
        // Swap positions
        const tempPos = defender.position;
        defender.position = challenger.position;
        challenger.position = tempPos;
        
        const notification = `${challenger.name} defeated ${defender.name} to take position #${tempPos}! ${defender.name} gained 1 life (now has ${defender.lives}).`;
        setNotifications(prev => [notification, ...prev].slice(0, 10));
      }
      
      // Update last match date
      defender.lastMatchDate = date;
      challenger.lastMatchDate = date;
      
      // Sort players by position after changes
      updatedPlayers.sort((a, b) => a.position - b.position);
      
      setPlayers(updatedPlayers);
      
      // Update challenge status
      setChallenges(challenges.map(c => 
        c.id === challenge.id 
          ? { ...c, status: 'completed' }
          : c
      ));
    }
  };

  const handleChallengeResponse = (challenge: Challenge, accept: boolean) => {
    const updatedPlayers = [...players];
    const defender = updatedPlayers.find(p => p.id === challenge.defenderId);
    const challenger = updatedPlayers.find(p => p.id === challenge.challengerId);
    
    if (!accept && defender) {
      defender.challengesDeclined += 1;
      defender.lastChallengeResponse = 'declined';
      setPlayers(updatedPlayers);
      
      // Add notification
      if (challenger) {
        const notification = `${defender.name} declined ${challenger.name}'s challenge!`;
        setNotifications(prev => [notification, ...prev].slice(0, 10));
      }
    } else if (accept && defender && challenger) {
      defender.lastChallengeResponse = 'accepted';
      
      // Add notification
      const notification = `${defender.name} accepted ${challenger.name}'s challenge!`;
      setNotifications(prev => [notification, ...prev].slice(0, 10));
    }

    setChallenges(challenges.map(c => 
      c.id === challenge.id 
        ? { ...c, status: accept ? 'accepted' : 'declined' }
        : c
    ));
  };

  // Check for expired challenges
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setChallenges(prevChallenges => 
        prevChallenges.map(challenge => {
          if (
            challenge.status === 'pending' && 
            new Date(challenge.responseDeadline) < now
          ) {
            const defender = players.find(p => p.id === challenge.defenderId);
            const challenger = players.find(p => p.id === challenge.challengerId);
            
            if (defender) {
              setPlayers(prevPlayers => 
                prevPlayers.map(p => 
                  p.id === defender.id 
                    ? { ...p, challengesDeclined: p.challengesDeclined + 1 }
                    : p
                )
              );
              
              // Add notification
              if (challenger) {
                const notification = `${defender.name} did not respond to ${challenger.name}'s challenge in time!`;
                setNotifications(prev => [notification, ...prev].slice(0, 10));
              }
            }
            return { ...challenge, status: 'declined', declineReason: 'timeout' };
          }
          return challenge;
        })
      );
    }, 60000);

    return () => clearInterval(interval);
  }, [players]);

  // Complete a match for accepted challenges
  const completeMatch = (challengeId: string, winnerId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge && challenge.status === 'accepted') {
      handleMatchComplete(challenge, winnerId);
    }
  };

  // Get active challenges
  const activeChallenges = challenges.filter(c => c.status === 'pending' || c.status === 'accepted');
  
  // Get recent matches
  const recentMatches = matches.slice(0, 5);

  // Ensure players are always sorted by position
  useEffect(() => {
    setPlayers(prev => [...prev].sort((a, b) => a.position - b.position));
  }, []);

  // Sort players by position for rendering
  const sortedPlayers = [...players].sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <div className="bg-green-800 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-4">BSC Singles Championship Ladder</h1>
          
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="bg-green-700/50 rounded-lg p-3 text-center">
              <Users className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{players.length}</p>
              <p className="text-xs">Warriors</p>
            </div>
            <div className="bg-green-700/50 rounded-lg p-3 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{daysRemaining}</p>
              <p className="text-xs">Days Left</p>
            </div>
            <div className="bg-green-700/50 rounded-lg p-3 text-center">
              <Award className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{activeChallenges.length}</p>
              <p className="text-xs">Active Challenges</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* Two-column layout */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main content - Ladder */}
          <div className="md:w-2/3">
            <Ladder 
              players={sortedPlayers} 
              challenges={challenges}
              onChallenge={handleChallenge}
              onRespond={handleChallengeResponse}
            />
          </div>
          
          {/* Sidebar - Notice Board */}
          <div className="md:w-1/3 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-6">
              <div className="bg-green-700 text-white px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Notice Board
                </h2>
              </div>
              
              <div className="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {/* Recent Activity */}
                <div className="mb-5">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center border-b pb-1">
                    <Bell className="w-4 h-4 mr-2" />
                    Recent Activity
                  </h3>
                  {notifications.length > 0 ? (
                    <ul className="space-y-2">
                      {notifications.map((notification, index) => (
                        <li key={index} className="text-sm bg-green-50 p-2 rounded-md border-l-4 border-green-400">
                          {notification}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No recent activity</p>
                  )}
                </div>
                
                {/* Active Challenges */}
                <div className="mb-5">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center border-b pb-1">
                    <Swords className="w-4 h-4 mr-2" />
                    Active Challenges
                  </h3>
                  {activeChallenges.length > 0 ? (
                    <ul className="space-y-2">
                      {activeChallenges.map(challenge => {
                        const challenger = players.find(p => p.id === challenge.challengerId);
                        const defender = players.find(p => p.id === challenge.defenderId);
                        if (challenger && defender) {
                          return (
                            <li key={challenge.id} className="text-sm bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                              <div className="flex flex-col">
                                <div className="font-medium">
                                  #{challenger.position} {challenger.name} vs #{defender.position} {defender.name}
                                </div>
                                <div className="text-xs mt-1 text-gray-600">
                                  {new Date(challenge.date).toLocaleDateString()} • 
                                  <span className={`ml-1 ${challenge.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {challenge.status === 'pending' ? 'Pending' : 'Accepted'}
                                  </span>
                                </div>
                                {challenge.status === 'accepted' && (
                                  <div className="flex space-x-1 mt-2">
                                    <button
                                      onClick={() => completeMatch(challenge.id, defender.id)}
                                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                      {defender.name} Won
                                    </button>
                                    <button
                                      onClick={() => completeMatch(challenge.id, challenger.id)}
                                      className="text-xs bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700 transition-colors"
                                    >
                                      {challenger.name} Won
                                    </button>
                                  </div>
                                )}
                              </div>
                            </li>
                          );
                        }
                        return null;
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No active challenges</p>
                  )}
                </div>
                
                {/* Recent Match Results */}
                <div>
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center border-b pb-1">
                    <Trophy className="w-4 h-4 mr-2" />
                    Recent Results
                  </h3>
                  {recentMatches.length > 0 ? (
                    <ul className="space-y-2">
                      {recentMatches.map(match => {
                        const challenger = players.find(p => p.id === match.challengerId);
                        const defender = players.find(p => p.id === match.defenderId);
                        const winner = players.find(p => p.id === match.winnerId);
                        if (challenger && defender && winner) {
                          return (
                            <li key={match.id} className="text-sm bg-yellow-50 p-3 rounded-md border-l-4 border-yellow-400">
                              <div className="font-medium">
                                <strong>{winner.name}</strong> won against {winner.id === challenger.id ? defender.name : challenger.name}
                              </div>
                              <div className="text-xs mt-1 text-gray-600">
                                {new Date(match.date).toLocaleDateString()}
                                {match.score && <span className="ml-2 font-medium">({match.score})</span>}
                              </div>
                            </li>
                          );
                        }
                        return null;
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No recent match results</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Button - Fixed Position */}
      <div className="fixed right-4 bottom-4 z-30">
        <button
          onClick={() => setShowRules(!showRules)}
          className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:bg-green-700 transition-colors focus:outline-none"
          aria-label="Contact & Booking"
        >
          <Phone className="w-6 h-6" />
        </button>
      </div>

      {/* Contact & Booking Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Contact & Information
              </h2>
              <button 
                onClick={() => setShowRules(false)}
                className="text-white hover:text-green-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="rounded-lg border border-gray-200 p-4 mb-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Book a Court</h3>
                    <div className="space-y-3">
                      <a 
                        href="https://api.whatsapp.com/send?phone=6285338073377" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-green-600 hover:text-green-800 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5 mr-2 text-green-500" />
                        <span>WhatsApp: +62 85338073377</span>
                      </a>
                      <a 
                        href="https://balisc.taykus.com/bookings" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        <span>Book on Taykus App</span>
                      </a>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border border-gray-200 p-4 mb-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Report Issues</h3>
                    <a 
                      href="https://api.whatsapp.com/send?phone=6282147958825" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-green-600 hover:text-green-800 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5 mr-2 text-green-500" />
                      <span>Contact Marius: +62 82147958825</span>
                    </a>
                  </div>
                  
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Community App</h3>
                    <p className="text-gray-700">
                      This app has been made by the community and is not a paid service. 
                      It exists for the love of padel and to enhance the player experience. 
                      Any issues or errors are not the responsibility of Bali Social Club.
                    </p>
                  </div>
                </div>
                
                <div>
                  <div className="rounded-lg border border-gray-200 p-4 mb-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Ladder Rules</h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start">
                        <div className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">1</div>
                        <div>
                          <strong>Lives System:</strong> Each player starts with 2 lives 
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>Issuing a challenge costs 1 life</li>
                            <li>Accepting a challenge gives +1 life (max 5) regardless of outcome</li>
                            <li>Players with 0 lives cannot issue challenges</li>
                          </ul>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">2</div>
                        <div>
                          <strong>Challenge Range:</strong>
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>Top 5 players can challenge 2 positions above</li>
                            <li>Others can challenge up to 3 positions above</li>
                          </ul>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">3</div>
                        <div>
                          <strong>Timeframe:</strong> Matches must be completed within 7 days
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Player Contacts</h3>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                      <a 
                        href="https://api.whatsapp.com/send?phone=6282147958825" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Marius: +62 82147958825</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=31625662220" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Benjamin: +31 6 25662220</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=447462698417" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Igor M.: +44 7462 698417</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=31650737191" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Bas: +31 6 50737191</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=447848861345" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Ben Robinson: +44 7848 861345</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=61409414296" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Brendon McQueen: +61 409 414 296</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=17869280055" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Chris Craig: +1 (786) 928-0055</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=6281249360674" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Elie Elias: +62 812-4936-0674</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=436601553320" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Fabian: +43 660 1553320</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=6587875871" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Gautam: +65 8787 5871</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=436764608713" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Hank: +43 676 4608713</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=6281238659433" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Jason Zielonka: +62 812-3865-9433</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=31631001393" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Jeffrey: +31 6 31001393</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=447429355501" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Joe: +44 7429 355501</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=6281353317389" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Julian Z: +62 813-5331-7389</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=46723892389" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Massih: +46 72 389 23 89</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=46701423020" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Mathias Bosson: +46 70 142 30 20</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=628214566036" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Matt Pickles: +62 821-4566-0366</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=33666249364" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Maximilien Calderon: +33 6 66 24 93 64</span>
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=66946681973" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span>Simon: +66 94 668 1973</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {selectedPlayer && (
        <ChallengeModal
          challenger={selectedPlayer}
          players={sortedPlayers}
          onSubmit={handleChallengeSubmit}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}

export default App;
