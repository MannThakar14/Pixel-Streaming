import { motion } from 'framer-motion'
import type { Socket } from 'socket.io-client'
import type { RoomUser, RoomData, JoinRequest } from '@/types/room'
import { JoinRequests } from './JoinRequests'
import { UserList } from './UserList'

interface RoomViewProps {
  roomData: RoomData
  users: RoomUser[]
  requests: JoinRequest[]
  socket: Socket | null
  username: string
  sessionStarted: boolean
  onApprove: (socket_id: string, user_id: string) => void
  onReject: (socket_id: string) => void
  onStartSession: () => void
  sessionStarting: boolean
}

export function RoomView({
  roomData,
  users,
  requests,
  socket,
  username,
  sessionStarted,
  onApprove,
  onReject,
  onStartSession,
  sessionStarting,
}: RoomViewProps) {
  return (
    <motion.div
      key="room"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
    >
      <div className="room-header">
        <div>
          <span className="badge badge-primary">Room ID: {roomData.room_id}</span>
          <h2 style={{ marginTop: '0.5rem' }}>Match Lobby</h2>
        </div>
        <button
          className="danger"
          style={{ width: 'auto' }}
          onClick={() => window.location.reload()}
        >
          Leave
        </button>
      </div>

      {roomData.isHost ? (
        <JoinRequests requests={requests} onApprove={onApprove} onReject={onReject} />
      ) : (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.05)',
            padding: '1.5rem',
            borderRadius: '16px',
            marginBottom: '2rem',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <p style={{ color: 'var(--success)', fontWeight: '600' }}>Logged in as {username}</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            You are now a participant in this room.
          </p>
        </div>
      )}

      <UserList users={users} roomData={roomData} socket={socket} />

      {roomData.isHost && !sessionStarted && (
        <button className={`primary ${sessionStarting ? 'disabled opacity-75 !cursor-not-allowed' : ''}`} style={{ marginTop: '2rem' }} disabled={sessionStarting}  onClick={sessionStarting ? undefined : onStartSession}>
          Start Live Session
          {sessionStarting && <span className="spinner ml-2"></span>}
        </button>
      )}

      {sessionStarted && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
            Session Live: Moving Data Active ⚡
          </p>
        </div>
      )}
    </motion.div>
  )
}
