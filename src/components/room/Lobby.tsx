import { motion } from 'framer-motion'
import { Plus, LogIn } from 'lucide-react'

interface LobbyProps {
  username: string
  setUsername: (v: string) => void
  joinRoomId: string
  setJoinRoomId: (v: string) => void
  error: string
  onCreateRoom: () => void
  onJoinRoom: () => void
}

export function Lobby({
  username,
  setUsername,
  joinRoomId,
  setJoinRoomId,
  error,
  onCreateRoom,
  onJoinRoom,
}: LobbyProps) {
  return (
    <motion.div
      key="lobby"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card"
    >
      <h1>Multiplayer Rooms</h1>
      <p className="subtitle">Secure, host-controlled access</p>

      {error && <div className="error-message">{error}</div>}

      <div className="input-group">
        <label>Your Name</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your nickname"
        />
      </div>

      <button className="primary" onClick={onCreateRoom}>
        <Plus size={20} /> Create New Room
      </button>

      <div className="divider">OR</div>

      <div className="input-group">
        <label>Room ID</label>
        <input
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
          placeholder="Enter 8-digit code"
        />
      </div>
      <button className="secondary" onClick={onJoinRoom}>
        <LogIn size={20} /> Join Private Room
      </button>
    </motion.div>
  )
}
