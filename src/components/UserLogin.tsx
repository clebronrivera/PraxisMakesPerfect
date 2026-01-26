import { useState, useEffect } from 'react';
import { User, Plus, Clock, FileText, X } from 'lucide-react';
import { 
  getAllUsersWithSessions, 
  getCurrentUser, 
  setCurrentUser,
  deleteUserSession,
  UserSessionList 
} from '../utils/userSessionStorage';

interface UserLoginProps {
  onUserSelected: (userName: string, sessionId?: string) => void;
}

export default function UserLogin({ onUserSelected }: UserLoginProps) {
  const [userName, setUserName] = useState('');
  const [users, setUsers] = useState<UserSessionList[]>([]);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    const current = getCurrentUser();
    if (current) {
      setSelectedUser(current);
    }
  }, []);

  const loadUsers = () => {
    const allUsers = getAllUsersWithSessions();
    setUsers(allUsers);
  };

  const handleCreateUser = () => {
    if (userName.trim()) {
      setCurrentUser(userName.trim());
      setSelectedUser(userName.trim());
      setShowNewUserForm(false);
      setUserName('');
      onUserSelected(userName.trim());
    }
  };

  const handleSelectUser = (name: string) => {
    setCurrentUser(name);
    setSelectedUser(name);
    onUserSelected(name);
  };

  const handleLoadSession = (userName: string, sessionId: string) => {
    setCurrentUser(userName);
    setSelectedUser(userName);
    onUserSelected(userName, sessionId);
  };

  const handleDeleteSession = (e: React.MouseEvent, userName: string, sessionId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteUserSession(sessionId, userName);
      loadUsers();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent">
            Praxis Study App
          </h1>
          <p className="text-slate-400">Enter your name to continue</p>
        </div>

        {/* New User Form */}
        {showNewUserForm ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-200">Create New User</h2>
              <button
                onClick={() => {
                  setShowNewUserForm(false);
                  setUserName('');
                }}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Your Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateUser()}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateUser}
                  disabled={!userName.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                >
                  Create & Continue
                </button>
                <button
                  onClick={() => {
                    setShowNewUserForm(false);
                    setUserName('');
                  }}
                  className="px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewUserForm(true)}
            className="w-full p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all group"
          >
            <Plus className="w-5 h-5 text-slate-400 group-hover:text-amber-400" />
            <span className="text-slate-300 group-hover:text-slate-200">Create New User</span>
          </button>
        )}

        {/* Existing Users */}
        {users.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
              <User className="w-5 h-5" />
              Load Past Session
            </h2>
            
            {users.map((user) => (
              <div key={user.userName} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-200">{user.userName}</h3>
                        <p className="text-xs text-slate-500">{user.sessions.length} session{user.sessions.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectUser(user.userName)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedUser === user.userName
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {selectedUser === user.userName ? 'Current' : 'Select'}
                    </button>
                  </div>
                </div>
                
                {user.sessions.length > 0 && (
                  <div className="p-4 space-y-2">
                    {user.sessions.map((session) => (
                      <button
                        key={session.sessionId}
                        onClick={() => handleLoadSession(user.userName, session.sessionId)}
                        className="w-full p-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 text-left">
                          {session.type === 'full-assessment' ? (
                            <FileText className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-400" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-200">
                              {session.type === 'full-assessment' ? 'Full Assessment' : 'Pre-Assessment'}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-slate-500">
                                {session.progress}% complete • {session.questionCount} questions
                              </p>
                              <p className="text-xs text-slate-600">
                                {formatDate(session.lastUpdated)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(e, user.userName, session.sessionId)}
                          className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete session"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Continue Button */}
        {selectedUser && (
          <button
            onClick={() => onUserSelected(selectedUser)}
            className="w-full p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center gap-3 font-semibold text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
          >
            Continue as {selectedUser}
          </button>
        )}
      </div>
    </div>
  );
}
