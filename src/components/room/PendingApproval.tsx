import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

interface PendingApprovalProps {
  joinRoomId: string
  onCancel: () => void
}

export function PendingApproval({ joinRoomId, onCancel }: PendingApprovalProps) {
  return (
    <motion.div
      key="pending"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="glass-card text-center"
    >
      <div className="status-waiting">
        <Shield
          size={64}
          className="animate-pulse"
          style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}
        />
        <h2>Waiting for Host</h2>
        <p className="subtitle">
          Your request to join <b>{joinRoomId}</b> has been sent.
        </p>
        <button className="danger" onClick={onCancel}>
          Cancel Request
        </button>
      </div>
    </motion.div>
  )
}
