import { useState, useEffect } from 'react';
import { Heart, Bell, Trophy, X, Swords, Phone, ExternalLink, MessageCircle, Info } from 'lucide-react';
import { Player, Challenge, Match } from './types';
import { initialPlayers } from './data';
import ChallengeInfo from './components/ChallengeInfo';
import ChallengeNotification from './components/ChallengeNotification';
import { 
  fetchPlayers, 
  fetchChallenges, 
  fetchMatches, 
  updatePlayer,
  updatePlayersBatch,
  createChallenge,
  updateChallenge,
  createMatch,
  subscribeToPlayers,
  subscribeToChallenges,
  subscribeToMatches
} from './services/database';

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [authPlayer, setAuthPlayer] = useState<Player | null>(null);
  const [authPassword, setAuthPassword] = useState("");
  const [authPurpose, setAuthPurpose] = useState<"challenge" | "respond" | "admin" | "login" | null>(null);
  const [pendingChallenge, setPendingChallenge] = useState<{challenge: Challenge, accept: boolean} | null>(null);
  const [pendingMatchCompletion, setPendingMatchCompletion] = useState<{challengeId: string, winnerId: string} | null>(null);
  const [matchScore, setMatchScore] = useState("");
  const daysRemaining = 75;
  const ADMIN_PASSWORD = "ADMIN";

  // Start player selection (login)
  const startPlayerSelection = (player: Player) => {
    setAuthPlayer(player);
    setAuthPurpose("login");
    setAuthPassword("");
  };

  // Initiate challenge to a specific player
  const initiateChallenge = async (defender: Player) => {
    if (!currentUser) {
      alert('Please select your player first');
      return;
    }
    
    if (currentUser.lives === 0) {
      alert('You have no lives left! You need to successfully defend your position to gain a life.');
      return;
    }
    
    // Confirm that the player is willing to spend a life on this challenge
    if (!window.confirm(`Challenging costs 1 life. You currently have ${currentUser.lives} lives. Proceed with challenge?`)) {
      return;
    }
    
    try {
      // Deduct a life immediately when challenging
      const updatedChallenger = {
        ...currentUser,
        lives: currentUser.lives - 1
      };
      
      // Update challenger in database
      await updatePlayer(updatedChallenger);
      
      // Create new challenge
      const newChallenge: Challenge = {
        id: Math.random().toString(36).substr(2, 9),
        challengerId: currentUser.id,
        defenderId: defender.id,
        status: 'pending',
        date: new Date().toISOString(),
        responseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      
      await createChallenge(newChallenge);
      
      // Add notification
      const notification = `${currentUser.name} has challenged ${defender.name} for position #${defender.position}!`;
      setNotifications(prev => [notification, ...prev].slice(0, 10));
      
      // Update current user locally
      setCurrentUser(updatedChallenger);
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to create challenge. Please try again.');
    }
  };

  const handlePasswordSubmit = () => {
    if (authPurpose === "admin") {
      // Admin authentication
      if (authPassword === ADMIN_PASSWORD) {
        if (pendingMatchCompletion) {
          const { challengeId, winnerId } = pendingMatchCompletion;
          const challenge = challenges.find(c => c.id === challengeId);
          
          if (challenge && matchScore.trim()) {
            // Complete the match with the entered score
            handleMatchComplete(challenge, winnerId, matchScore);
            resetAuthState();
          } else {
            alert("Please enter a valid score");
          }
        }
      } else {
        alert('Incorrect admin password! Please try again.');
      }
      return;
    }

    if (!authPlayer) return;
    
    // Check if password is correct
    if (authPassword === authPlayer.password) {
      if (authPurpose === "login") {
        // Set current user after successful login
        setCurrentUser(authPlayer);
        resetAuthState();
      } else if (authPurpose === "respond" && pendingChallenge) {
        // Password correct for response
        const { challenge, accept } = pendingChallenge;
        processResponse(challenge, accept);
        resetAuthState();
      }
    } else {
      alert('Incorrect password! Please try again.');
    }
  };

  // Logout current user
  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Reset all authentication state
  const resetAuthState = () => {
    setAuthPlayer(null);
    setAuthPassword("");
    setAuthPurpose(null);
    setPendingChallenge(null);
    setPendingMatchCompletion(null);
    setMatchScore("");
  };

  // Process the challenge response after authentication
  const processResponse = async (challenge: Challenge, accept: boolean) => {
    try {
      const updatedPlayers = [...players];
      const defender = updatedPlayers.find(p => p.id === challenge.defenderId);
      const challenger = updatedPlayers.find(p => p.id === challenge.challengerId);
      
      if (!accept && defender) {
        defender.challengesDeclined += 1;
        defender.lastChallengeResponse = 'declined';
        
        // Update player in database
        await updatePlayer(defender);
        
        // Add notification
        if (challenger) {
          const notification = `${defender.name} declined ${challenger.name}'s challenge!`;
          setNotifications(prev => [notification, ...prev].slice(0, 10));
        }
      } else if (accept && defender && challenger) {
        defender.lastChallengeResponse = 'accepted';
        
        // Update player in database
        await updatePlayer(defender);
        
        // Add notification
        const notification = `${defender.name} accepted ${challenger.name}'s challenge!`;
        setNotifications(prev => [notification, ...prev].slice(0, 10));
      }

      // Update challenge in database
      const updatedChallenge = {
        ...challenge,
        status: accept ? 'accepted' as const : 'declined' as const
      };
      await updateChallenge(updatedChallenge);
    } catch (error) {
      console.error('Error processing response:', error);
      alert('Failed to process response. Please try again.');
    }
  };

  const handleChallengeResponse = (challenge: Challenge, accept: boolean) => {
    // Start authentication flow
    const defender = players.find(playerItem => playerItem.id === challenge.defenderId);
    if (defender) {
      setAuthPlayer(defender);
      setAuthPurpose("respond");
      setAuthPassword("");
      setPendingChallenge({ challenge, accept });
    }
  };

  // Complete a match for accepted challenges - with admin authentication
  const completeMatch = (challengeId: string, winnerId: string) => {
    // Start admin authentication
    setAuthPurpose("admin");
    setAuthPassword("");
    setPendingMatchCompletion({ challengeId, winnerId });
    setMatchScore("");
  };

  const handleMatchComplete = async (challenge: Challenge, winnerId: string, score: string = "6-4, 7-5") => {
    try {
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
          score
        };
        
        await createMatch(match);
        
        // Defender wins
        if (winnerId === defender.id) {
          // Successful defense gives +1 life (max 5)
          defender.lives = Math.min(5, defender.lives + 1);
          defender.matchesWon++;
          challenger.matchesLost++;
          
          // Challenger already lost a life when initiating the challenge
          // No further life deduction needed here
          
          // Add notification with life information
          const notification = `${defender.name} successfully defended position #${defender.position} against ${challenger.name}! ${defender.name} gained 1 life (now has ${defender.lives}).`;
          setNotifications(prev => [notification, ...prev].slice(0, 10));
        } 
        // Challenger wins
        else {
          // Challenger already lost a life when initiating the challenge
          // But we'll ensure they have at least 1 life after winning
          challenger.lives = Math.max(1, challenger.lives);
          challenger.matchesWon++;
          defender.matchesLost++;
          
          // Defender still gains 1 life for accepting the challenge
          defender.lives = Math.min(5, defender.lives + 1);
          
          // Swap positions
          const tempPos = defender.position;
          defender.position = challenger.position;
          challenger.position = tempPos;
          
          // Add notification with life information
          const notification = `${challenger.name} defeated ${defender.name} to take position #${tempPos}! ${defender.name} gained 1 life (now has ${defender.lives}).`;
          setNotifications(prev => [notification, ...prev].slice(0, 10));
        }
        
        // Update last match date
        defender.lastMatchDate = date;
        challenger.lastMatchDate = date;
        
        // Update players in database
        await updatePlayersBatch([defender, challenger]);
        
        // Update challenge status
        const updatedChallenge = {
          ...challenge,
          status: 'completed' as const
        };
        await updateChallenge(updatedChallenge);
      }
    } catch (error) {
      console.error('Error completing match:', error);
      alert('Failed to complete match. Please try again.');
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [fetchedPlayers, fetchedChallenges, fetchedMatches] = await Promise.all([
          fetchPlayers(),
          fetchChallenges(),
          fetchMatches()
        ]);
        
        setPlayers(fetchedPlayers);
        setChallenges(fetchedChallenges);
        setMatches(fetchedMatches);
      } catch (error) {
        console.error('Error loading initial data:', error);
        // Fallback to initial data if database fetch fails
        setPlayers(initialPlayers);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (loading) return;
    
    const unsubscribePlayers = subscribeToPlayers((updatedPlayers) => {
      setPlayers(updatedPlayers);
      
      // Update current user if they were updated
      if (currentUser) {
        const updatedCurrentUser = updatedPlayers.find(p => p.id === currentUser.id);
        if (updatedCurrentUser) {
          setCurrentUser(updatedCurrentUser);
        }
      }
    });
    
    const unsubscribeChallenges = subscribeToChallenges((updatedChallenges) => {
      setChallenges(updatedChallenges);
    });
    
    const unsubscribeMatches = subscribeToMatches((updatedMatches) => {
      setMatches(updatedMatches);
    });
    
    return () => {
      unsubscribePlayers();
      unsubscribeChallenges();
      unsubscribeMatches();
    };
  }, [loading, currentUser]);

  // Ensure players are always sorted by position
  useEffect(() => {
    setPlayers(prev => [...prev].sort((a, b) => a.position - b.position));
  }, [players]);

  // Get players that the current user can challenge
  const getChallengablePlayers = () => {
    if (!currentUser) return [];
    const currentIndex = players.findIndex(player => player.id === currentUser.id);
    if (currentIndex <= 0) return [];
    return players.filter((_, index) => 
      index < currentIndex && 
      index >= Math.max(0, currentIndex - 3)
    );
  };
  
  const challengablePlayers = getChallengablePlayers();

  // Get active challenges
  const activeChallenges = challenges.filter(c => c.status === 'pending' || c.status === 'accepted');
  
  // Get recent matches
  const recentMatches = matches.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <div className="bg-green-800 text-white py-4 px-3 md:py-6 md:px-4">
        <div className="max-w-6xl mx-auto">
          {/* Desktop header */}
          <div className="hidden md:flex md:justify-between md:items-center">
            <h1 className="text-3xl font-bold">BSC Singles Championship Ladder</h1>
            <div className="flex items-center space-x-4">
              <span>Season ends in {daysRemaining} days</span>
              <button 
                onClick={() => setShowRules(true)}
                className="bg-white text-green-700 hover:bg-green-100 px-3 py-1 rounded-md flex items-center font-medium shadow-sm transition-colors"
                title="View Ladder Rules"
              >
                <Info className="w-4 h-4 mr-1" />
                Rules
              </button>
            </div>
          </div>
          
          {/* Mobile header */}
          <div className="md:hidden">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">BSC Singles Ladder</h1>
              <button 
                onClick={() => setShowRules(true)}
                className="bg-white text-green-700 hover:bg-green-100 w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
                title="View Ladder Rules"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm mt-1">
              Season ends: <span className="font-medium">{daysRemaining} days</span>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="max-w-6xl mx-auto p-4 flex justify-center items-center h-screen">
          <div className="text-2xl font-bold">Loading...</div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto p-4">
          {/* Player selection and authentication modal */}
          {currentUser ? (
            <div className="flex items-center">
              <div className="font-medium text-green-800 mr-3">
                Playing as: <span className="font-bold">{currentUser.name}</span>
              </div>
              <div className="text-sm text-gray-600 mr-3">
                Position: <span className="font-semibold">#{currentUser.position}</span>
              </div>
              <div className="text-sm text-gray-600 mr-3">
                Lives: <span className="font-semibold text-green-500">{Array(currentUser.lives).fill('❤️').join('')}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="ml-4 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                Logout
              </button>
              <ChallengeInfo currentUser={currentUser} />
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">Select your player:</span>
              <div className="relative inline-block text-left">
                <select 
                  className="bg-white border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                  onChange={(e) => {
                    const playerId = e.target.value;
                    if (playerId) {
                      const player = players.find(playerItem => playerItem.id === playerId);
                      if (player) {
                        startPlayerSelection(player);
                      }
                    }
                  }}
                  value=""
                >
                  <option value="">Choose player...</option>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      #{player.position} {player.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {/* Contact Button - Fixed Position */}
          <div className="fixed right-4 bottom-4 z-30">
            <button
              onClick={() => setShowContactInfo(!showContactInfo)}
              className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:bg-green-700 transition-colors focus:outline-none"
              aria-label="Contact & Booking"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>

          {/* Contact & Information Modal */}
          {showContactInfo && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
                <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    Contact & Information
                  </h2>
                  <button 
                    onClick={() => setShowContactInfo(false)}
                    className="text-white hover:text-green-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
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
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Rules Modal */}
          {showRules && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto">
                <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-10">
                  <h2 className="text-lg font-bold flex items-center">
                    <Info className="w-5 h-5 mr-2" />
                    Ladder Rules
                  </h2>
                  <button 
                    onClick={() => setShowRules(false)}
                    className="text-white hover:text-green-200 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-4 md:p-6">
                  {/* Intro paragraph */}
                  <div className="mb-4 border-b border-gray-100 pb-4">
                    <p className="text-sm text-gray-700">
                      This ladder system uses an innovative lives mechanic to ensure fair play and active participation from all players.
                    </p>
                  </div>
                  
                  {/* Rules list */}
                  <div className="space-y-5">
                    {/* Lives System */}
                    <div className="bg-green-50 rounded-lg p-3 md:p-4">
                      <div className="flex items-center mb-2">
                        <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</div>
                        <h3 className="font-bold text-green-800">Lives System</h3>
                      </div>
                      
                      <div className="ml-8">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-white rounded p-2 text-center text-xs border border-green-100">
                            <div className="font-bold text-green-700 text-sm">2</div>
                            Starting Lives
                          </div>
                          <div className="bg-white rounded p-2 text-center text-xs border border-green-100">
                            <div className="font-bold text-green-700 text-sm">5</div>
                            Maximum Lives
                          </div>
                        </div>
                        
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start">
                            <span className="text-green-700 mr-2">•</span>
                            <span>Issuing a challenge costs <b>1 life</b></span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-700 mr-2">•</span>
                            <span>Accepting a challenge gives <b>+1 life</b></span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-700 mr-2">•</span>
                            <span>With <b>0 lives</b>, you cannot challenge</span>
                          </li>
                        </ul>
                        
                        <div className="mt-3 text-xs bg-yellow-50 p-2 rounded border border-yellow-100">
                          <p><b>Why this matters:</b> It prevents higher players from refusing all challenges and lower players from spamming challenges.</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Challenge Range */}
                    <div className="bg-blue-50 rounded-lg p-3 md:p-4">
                      <div className="flex items-center mb-2">
                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</div>
                        <h3 className="font-bold text-blue-800">Challenge Range</h3>
                      </div>
                      
                      <div className="ml-8">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-white rounded p-2 text-center text-xs border border-blue-100">
                            <div className="font-bold text-blue-700 text-base">2</div>
                            Top 5 players
                          </div>
                          <div className="bg-white rounded p-2 text-center text-xs border border-blue-100">
                            <div className="font-bold text-blue-700 text-base">3</div>
                            All other players
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600">
                          Players can only challenge others who are within the position range shown above.
                        </p>
                      </div>
                    </div>
                    
                    {/* Timeframe */}
                    <div className="bg-purple-50 rounded-lg p-3 md:p-4">
                      <div className="flex items-center mb-2">
                        <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</div>
                        <h3 className="font-bold text-purple-800">Match Timeframe</h3>
                      </div>
                      
                      <div className="ml-8">
                        <div className="bg-white rounded p-2 text-center md:w-1/3 text-xs border border-purple-100">
                          <div className="font-bold text-purple-700 text-base">7 days</div>
                          to complete match
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-2">
                          All matches must be completed within 7 days after a challenge is accepted.
                        </p>
                      </div>
                    </div>
                    
                    {/* How App Works */}
                    <div className="bg-orange-50 rounded-lg p-3 md:p-4">
                      <div className="flex items-center mb-2">
                        <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">4</div>
                        <h3 className="font-bold text-orange-800">How This App Works</h3>
                      </div>
                      
                      <div className="ml-8 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <div className="bg-white rounded p-2 text-center text-xs border border-orange-100 md:w-1/4">
                            <div className="font-bold text-orange-700">Step 1</div>
                            Player Login
                          </div>
                          <p className="text-xs text-gray-600">
                            Select your name and enter your unique 4-digit PIN code (provided when you join the ladder).
                          </p>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <div className="bg-white rounded p-2 text-center text-xs border border-orange-100 md:w-1/4">
                            <div className="font-bold text-orange-700">Step 2</div>
                            Issue Challenge
                          </div>
                          <p className="text-xs text-gray-600">
                            Challenge a player within your allowed range by clicking the challenge button next to their name.
                          </p>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <div className="bg-white rounded p-2 text-center text-xs border border-orange-100 md:w-1/4">
                            <div className="font-bold text-orange-700">Step 3</div>
                            Play Match
                          </div>
                          <p className="text-xs text-gray-600">
                            Contact your opponent via WhatsApp by clicking their name. Arrange and play your match within 7 days.
                          </p>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <div className="bg-white rounded p-2 text-center text-xs border border-orange-100 md:w-1/4">
                            <div className="font-bold text-orange-700">Step 4</div>
                            Report Result
                          </div>
                          <p className="text-xs text-gray-600">
                            After the match, tag the admin in the WhatsApp group to report your match results and they will update the ladder.
                          </p>
                        </div>
                        
                        <div className="mt-1 text-xs bg-blue-50 p-2 rounded border border-blue-100">
                          <p><b>Note:</b> Only admins can confirm match results to ensure fair play. Tag them in the WhatsApp group and they will update the ladder rankings automatically.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="max-w-6xl mx-auto py-6 px-4">
            {/* Two-column layout */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Main content - Ladder */}
              <div className="md:w-2/3">
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Player Standings</h2>
                    <button 
                      onClick={() => setShowRules(true)}
                      className="text-white hover:text-green-200 flex items-center"
                      title="View Rules & Information"
                    >
                      <Info className="w-5 h-5 mr-1" />
                      <span className="text-sm">Rules</span>
                    </button>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {players.map((player) => {
                      const isCurrentUser = currentUser?.id === player.id;
                      const canBeChallengedByCurrentUser = currentUser && challengablePlayers.some(playerToChallenge => playerToChallenge.id === player.id);
                      const pendingChallenges = challenges.filter(challenge => 
                        challenge.status === 'pending' && 
                        ((challenge.challengerId === player.id) || (challenge.defenderId === player.id))
                      );
                      const hasPendingChallenge = pendingChallenges.length > 0;
                      
                      // Check if current user can challenge this player
                      const isChallengable = canBeChallengedByCurrentUser && !hasPendingChallenge;
                      
                      // Get challenge to this player (if exists)
                      const challengeToThisPlayer = challenges.find(c => 
                        c.status === 'pending' && 
                        c.defenderId === player.id && 
                        c.challengerId === currentUser?.id
                      );
                      
                      // Get challenge from this player (if exists)
                      const challengeFromThisPlayer = challenges.find(c => 
                        c.status === 'pending' && 
                        c.challengerId === player.id && 
                        c.defenderId === currentUser?.id
                      );
                      
                      return (
                        <div 
                          key={player.id} 
                          className={`flex items-center justify-between p-4 ${isCurrentUser ? 'bg-green-50' : ''} hover:bg-gray-50 transition duration-150 border-b`}
                        >
                          <div className="flex items-center">
                            <div className="font-bold text-xl mr-4 w-8 text-center text-green-800">#{player.position}</div>
                            <div>
                              <div className="font-medium text-lg flex items-center">
                                {player.name}
                                {isCurrentUser && <span className="ml-2 text-xs font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">You</span>}
                                {player.name === "Marius" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=6282147958825"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Benjamin" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=31625662220"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Igor M." && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=447462698417"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Bas" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=31650737191"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Ben" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=447848861345"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Brendon McQueen" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=61409414296"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Chris" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=17869280055"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Elie" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=6281249360674"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Fabian" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=436601553320"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Gautam" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=6587875871"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Hank" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=436764608713"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Jason Zielonka" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=6281238659433"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Jeffrey" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=31631001393"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Joe" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=447429355501"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Julian Z" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=6281353317389"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Massih" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=46723892389"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Mathias" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=46701423020"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Pickles" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=628214566036"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Maximilien" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=33666249364"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                                {player.name === "Simon" && (
                                  <a
                                    href="https://api.whatsapp.com/send?phone=66946681973"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-green-500 hover:text-green-700"
                                    title="Contact on WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 flex items-center space-x-2">
                                <span className="bg-gray-100 px-2 py-0.5 rounded">Rank: {player.rank}</span>
                                <span className="bg-gray-100 px-2 py-0.5 rounded">W/L: {player.matchesWon}/{player.matchesLost}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {Array(player.lives).fill(0).map((_, i) => (
                                <Heart key={i} className="w-5 h-5 inline text-green-500 fill-current" />
                              ))}
                            </div>
                            {isChallengable && (
                              <button
                                onClick={() => initiateChallenge(player)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                              >
                                Challenge
                              </button>
                            )}
                            
                            {challengeToThisPlayer && (
                              <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md">
                                Challenge Pending
                              </div>
                            )}
                            
                            {challengeFromThisPlayer && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleChallengeResponse(challengeFromThisPlayer, true)}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleChallengeResponse(challengeFromThisPlayer, false)}
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                            
                            {player.lives === 0 && !isChallengable && !challengeToThisPlayer && !challengeFromThisPlayer && (
                              <div className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-md">
                                No lives
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Sidebar - Notice Board */}
              <div className="md:w-1/3 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-6">
                  <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Player Standings</h2>
                    <button 
                      onClick={() => setShowRules(true)}
                      className="text-white hover:text-green-200 flex items-center"
                      title="View Rules & Information"
                    >
                      <Info className="w-5 h-5 mr-1" />
                      <span className="text-sm">Rules</span>
                    </button>
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
                            const challenger = players.find(playerItem => playerItem.id === challenge.challengerId);
                            const defender = players.find(playerItem => playerItem.id === challenge.defenderId);
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
                            const challenger = players.find(playerItem => playerItem.id === match.challengerId);
                            const defender = players.find(playerItem => playerItem.id === match.defenderId);
                            const winner = players.find(playerItem => playerItem.id === match.winnerId);
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

          {/* Authentication Modal */}
          {(authPlayer || authPurpose === "admin") && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4 text-green-800">
                  {authPurpose === "login" 
                    ? `Verify it's you, ${authPlayer?.name}` 
                    : authPurpose === "respond" 
                      ? `Confirm response, ${authPlayer?.name}`
                      : "Admin Authentication"}
                </h2>
                
                <p className="mb-4 text-gray-600">
                  {authPurpose === "login" 
                    ? "Please enter your player password to login." 
                    : authPurpose === "respond"
                      ? "Please enter your player password to respond to this challenge."
                      : "Please enter the admin password to record match results."}
                </p>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-1" htmlFor="password">
                    Password
                  </label>
                  <input 
                    type="text"
                    id="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value.toUpperCase())}
                    placeholder={authPurpose === "admin" ? "Enter admin password" : "Enter your 4-letter password"}
                    maxLength={authPurpose === "admin" ? 5 : 4}
                    className="w-full p-2 border rounded focus:border-green-500 focus:ring-1 focus:ring-green-500 uppercase"
                  />
                </div>

                {/* Score input for admin match completion */}
                {authPurpose === "admin" && pendingMatchCompletion && (
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-1" htmlFor="score">
                      Match Score
                    </label>
                    <input 
                      type="text"
                      id="score"
                      value={matchScore}
                      onChange={(e) => setMatchScore(e.target.value)}
                      placeholder="e.g. 6-4, 7-5"
                      className="w-full p-2 border rounded focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the score in format: 6-4, 7-5</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={resetAuthState}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordSubmit}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Challenge Notification */}
          {pendingChallenge && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
              <ChallengeNotification 
                challenge={pendingChallenge.challenge}
                onAccept={() => handleChallengeResponse(pendingChallenge.challenge, true)} 
                onDecline={() => handleChallengeResponse(pendingChallenge.challenge, false)} 
                onCancel={() => setPendingChallenge(null)} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
