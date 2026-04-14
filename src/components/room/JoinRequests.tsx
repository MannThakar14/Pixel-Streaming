import { AnimatePresence, motion } from 'framer-motion'
import { Shield, User, Check, X } from 'lucide-react'
import type { JoinRequest } from '@/types/room'

interface JoinRequestsProps {
  requests: JoinRequest[]
  onApprove: (socket_id: string, user_id: string) => void
  onReject: (socket_id: string) => void
}

export function JoinRequests({ requests, onApprove, onReject }: JoinRequestsProps) {
  return (
    <div className="requests-section">
      <h3>
        <Shield size={18} /> Pending Requests ({requests.length})
      </h3>
      <AnimatePresence>
        {requests.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', padding: '1rem' }}>No pending requests</p>
        ) : (
          requests.map((req) => (
            <motion.div
              key={req.socket_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="list-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={18} />
                <span>{req.username}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="success"
                  style={{ padding: '0.5rem' }}
                  onClick={() => onApprove(req.socket_id, req.user_id)}
                >
                  <Check size={18} />
                </button>
                <button
                  className="danger"
                  style={{ padding: '0.5rem' }}
                  onClick={() => onReject(req.socket_id)}
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  )
}
