import { Users, User, Crown } from 'lucide-react'
import type { Socket } from 'socket.io-client'
import type { RoomUser, RoomData } from '@/types/room'

interface UserListProps {
  users: RoomUser[]
  roomData: RoomData
  socket: Socket | null
}

export function UserList({ users, roomData, socket }: UserListProps) {
  return (
    <div className="user-list">
      <h3>
        <Users size={18} /> Players In Room ({users.length})
      </h3>
      <div style={{ marginTop: '1rem' }}>
        {users.map((u) => (
          <div
            key={u.socket_id}
            className="list-item"
            style={{
              border:
                u.socket_id === roomData.host_id
                  ? '1px solid var(--primary)'
                  : '1px solid var(--glass-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={18} />
              <span>
                {u.username} {u.socket_id === socket?.id && '(You)'}
              </span>
            </div>
            {u.socket_id === roomData.host_id && (
              <span
                className="badge badge-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Crown size={12} /> Host
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
