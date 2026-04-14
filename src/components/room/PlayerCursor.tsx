import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import type { Position } from '@/types/room'

interface PlayerCursorProps {
  socket_id: string
  username: string
  position: Position
  isSelf: boolean
  isHost: boolean
}

export function PlayerCursor({ username, position, isSelf, isHost }: PlayerCursorProps) {
  return (
    <motion.div
      initial={false}
      animate={{ left: `${position.x}%`, top: `${position.y}%` }}
      transition={{ type: 'spring', damping: 30, stiffness: 250 }}
      className="player-cursor"
      style={{
        transform: 'translate(-50%, -50%)',
        zIndex: isSelf ? 80 : 60,
      }}
    >
      <div
        className="cursor-dot"
        style={{
          background: isHost ? '#fbbf24' : 'var(--primary)',
          border: isSelf ? '2px solid white' : 'none',
          boxShadow: isSelf ? '0 0 15px rgba(255,255,255,0.5)' : 'none',
        }}
      />
      <div className="cursor-label" style={{ opacity: isSelf ? 1 : 0.8 }}>
        {isHost && <Crown size={10} className="host-tag" />}
        {username} {isSelf && '(You)'}
      </div>
    </motion.div>
  )
}
