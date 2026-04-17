import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Crown, RefreshCw, WifiOff, Loader2 } from 'lucide-react'
import type { Socket } from 'socket.io-client'
import type { RoomUser, RoomData } from '@/types/room'
import { PixelStreamingWrapper } from '@/components/PixelStreamingWrapper'
import { useEffect, useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { usePixelStreamingStore } from '@/store/pixelStreamingStore.ts'
import { useShallow } from 'zustand/react/shallow'

// ── Retry configuration ────────────────────────────────────
const INITIAL_RETRY_DELAY = 5_000 // 5 seconds for the first retry
const MAX_RETRY_DELAY = 30_000 // cap at 30 seconds
const RETRY_BACKOFF_STEP = 5_000 // add 5 s per attempt (5 → 10 → 15 → … → 30)
const MAX_RETRIES = 10
const GRACE_PERIOD = 8_000 // wait 8 s after mount before first retry

interface LiveSessionProps {
  users: RoomUser[]
  roomData: RoomData
  signalingPort: number | null
  socket: Socket | null
  onStopSession: () => void
  onChangeGameMode: (mode: string, num_cubes?: number) => void
}

export function LiveSession({
  users,
  roomData,
  socket,
  signalingPort,
  onStopSession,
  onChangeGameMode,
}: LiveSessionProps) {
  const [
    streaming,
    connectionStatus,
    retryCount,
    setRetryCount,
    triggerReconnect,
  ] = usePixelStreamingStore(
    useShallow((s) => [
      s.pixelStreaming,
      s.connectionStatus,
      s.retryCount,
      s.setRetryCount,
      s.triggerReconnect,
    ]),
  )

  const [isCubeSetupDone, setIsCubeSetupDone] = useState(false)
  const [cubeCount, setCubeCount] = useState<number | ''>(1)
  const [spawnedCount, setSpawnedCount] = useState(0)
  const [isPendingModeChange, setIsPendingModeChange] = useState(false)

  // ── Retry state ──────────────────────────────────────────
  const [countdown, setCountdown] = useState<number | null>(null)
  const retryTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountTime = useRef(Date.now())

  /** Compute delay for the current attempt (linear backoff, capped) */
  const getDelay = useCallback(
    (attempt: number) =>
      Math.min(
        INITIAL_RETRY_DELAY + (attempt - 1) * RETRY_BACKOFF_STEP,
        MAX_RETRY_DELAY,
      ),
    [],
  )

  /** Clear any running retry timer */
  const clearRetryTimer = useCallback(() => {
    if (retryTimer.current) {
      clearInterval(retryTimer.current)
      retryTimer.current = null
    }
    setCountdown(null)
  }, [])

  /** Kick off a single retry attempt */
  const doRetry = useCallback(() => {
    if (retryCount >= MAX_RETRIES) {
      toast.error('Retry limit reached.')
      return
    }

    clearRetryTimer()
    const nextAttempt = retryCount + 1
    setRetryCount(nextAttempt)
    triggerReconnect()
    toast.info(`Reconnection attempt #${nextAttempt}…`)
  }, [retryCount, clearRetryTimer, setRetryCount, triggerReconnect])

  // ── Auto-retry logic ────────────────────────────────────
  useEffect(() => {
    // 🚫 Stop retrying after max attempts
    if (retryCount >= MAX_RETRIES) {
      clearRetryTimer()
      toast.error('Failed to connect after multiple attempts.')
      return
    }

    // Already connected → stop retrying
    if (connectionStatus === 'connected') {
      if (retryCount > 0) {
        toast.success('Stream connected successfully!')
      }
      clearRetryTimer()
      setRetryCount(0)
      return
    }

    // Grace period logic...
    if (Date.now() - mountTime.current < GRACE_PERIOD) {
      const graceTimeout = setTimeout(
        () => {
          const status = usePixelStreamingStore.getState().connectionStatus
          if (status !== 'connected') {
            doRetry()
          }
        },
        GRACE_PERIOD - (Date.now() - mountTime.current),
      )
      return () => clearTimeout(graceTimeout)
    }

    const delay = getDelay(retryCount + 1)
    let remaining = Math.ceil(delay / 1000)
    setCountdown(remaining)

    retryTimer.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        doRetry()
      } else {
        setCountdown(remaining)
      }
    }, 1000)

    return () => clearRetryTimer()
  }, [connectionStatus, retryCount])

  //  Send event to Unreal
  const sendToUE = (data: any) => {
    if (!streaming) {
      console.warn('Pixel Streaming not ready')
      return
    }

    try {
      streaming.emitUIInteraction(JSON.stringify(data))
    } catch (err) {
      console.error('Failed to send event to UE', err)
    }
  }

  //  Listen responses from UE
  useEffect(() => {
    if (streaming) {
      const handler = (response: any) => {
        console.log('UE Response:', response)

        try {
          const parsed = JSON.parse(response)

          //  UE confirmed spawn, but we rely on the socket event for the counter
          if (parsed.type === 'CUBES_SPAWNED') {
            console.log('UE confirmed spawn of:', parsed.count)
          }
        } catch {
          console.log('Non-JSON response:', response)
        }
      }

      streaming.addResponseEventListener('message', handler)

      return () => {
        streaming.removeResponseEventListener('message')
      }
    }
  }, [streaming])

  //  Socket sync
  useEffect(() => {
    if (!socket) return

    const handleCubeSetup = (data: { count: number }) => {
      setCubeCount(data.count)
      // Do not set isCubeSetupDone(true) here; wait for game_mode_changed event
    }

    const handleCubeSpawned = (data: { count: number }) => {
      setSpawnedCount((prev) => prev + data.count)
    }

    socket.on('cube_setup_done', handleCubeSetup)
    socket.on('cube_spawned', handleCubeSpawned)

    return () => {
      socket.off('cube_setup_done', handleCubeSetup)
      socket.off('cube_spawned', handleCubeSpawned)
    }
  }, [socket])

  //  Sync isCubeSetupDone with roomData.game_mode
  useEffect(() => {
    if (roomData.game_mode === 'Player') {
      setIsCubeSetupDone(true)
      setIsPendingModeChange(false)
    } else {
      setIsCubeSetupDone(false)
    }
  }, [roomData.game_mode])

  // ── Derived booleans for overlay ────────────────────────
  const showOverlay = connectionStatus !== 'connected'
  const isRetrying = retryCount > 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="live-session-container"
      >
        {/* STREAM */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <PixelStreamingWrapper
            initialSettings={{
              AutoPlayVideo: true,
              AutoConnect: true,
              ss: `ws://localhost:${signalingPort}`,
              StartVideoMuted: true,
              HoveringMouse: true,
              WaitForStreamer: true,
            }}
          />
        </div>

        <div className="grid-overlay" style={{ zIndex: 10 }} />

        {/* ── CONNECTION STATUS OVERLAY ───────────────────── */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              key="connection-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '1.25rem',
                  padding: '2.5rem 3rem',
                  textAlign: 'center',
                  color: '#f1f5f9',
                  maxWidth: '420px',
                  width: '90%',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                {/* Icon */}
                <div style={{ marginBottom: '1rem' }}>
                  {!isRetrying ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: 'linear',
                      }}
                      style={{ display: 'inline-block' }}
                    >
                      <Loader2 size={40} style={{ color: '#60a5fa' }} />
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: 'linear',
                      }}
                      style={{ display: 'inline-block' }}
                    >
                      <RefreshCw size={40} style={{ color: '#fbbf24' }} />
                    </motion.div>
                  )}
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    margin: '0 0 0.5rem',
                  }}
                >
                  {!isRetrying ? 'Connecting to stream…' : 'Reconnecting…'}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: '#94a3b8',
                    margin: '0 0 1.25rem',
                    lineHeight: 1.5,
                  }}
                >
                  {!isRetrying ? (
                    'Establishing connection to the signaling server. Please wait.'
                  ) : (
                    <>
                      Attempt{' '}
                      <strong style={{ color: '#fbbf24' }}>
                        #{retryCount}
                      </strong>
                      {countdown !== null && (
                        <>
                          {' '}
                          — retrying in{' '}
                          <strong style={{ color: '#f1f5f9' }}>
                            {countdown}s
                          </strong>
                        </>
                      )}
                    </>
                  )}
                </p>

                {/* Manual retry button */}
                <button
                  onClick={doRetry}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.4rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#f1f5f9',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    'rgba(255,255,255,0.18)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
                  }
                >
                  <RefreshCw size={16} /> Retry Now
                </button>

                {/* Connection indicator */}
                <div
                  style={{
                    marginTop: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    fontSize: '0.75rem',
                    color: '#64748b',
                  }}
                >
                  <>
                    <WifiOff size={14} style={{ color: '#ef4444' }} />{' '}
                    Disconnected
                  </>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD */}
        <div className="session-hud" style={{ zIndex: 20 }}>
          <div className="live-indicator">LIVE SESSION</div>
          <div className="divider" style={{ margin: '0 0.5rem' }} />
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>
              {users.length} {users.length > 1 ? 'Players' : 'Player'}
            </span>
          </div>
        </div>

        {/*  SPAWNED COUNT (TOP RIGHT) */}
        {/* {isCubeSetupDone && (
          <div className="absolute top-24 right-4 z-20 bg-black/40 px-4 py-2 rounded-lg text-white backdrop-blur">
            Spawned Cubes: {spawnedCount}
          </div>
        )} */}

        {/* HOST INPUT */}
        {/* {roomData.isHost && !isCubeSetupDone && (
          <div className="absolute top-4 left-4 z-20 w-64">
            <div className="flex flex-col gap-4 bg-white/10 p-5 rounded-2xl text-white">
              <label>Number of Cubes</label>
              <input
                type="text"
                value={cubeCount}
                inputMode="numeric"
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9]/g, '')
                  if (value === '') {
                    setCubeCount('')
                    return
                  }
                  let num = Number(value)
                  if (num > 100) num = 100
                  if (num < 1) num = 1
                  setCubeCount(num)
                }}
                className="px-3 py-2 rounded text-black bg-white"
              />

              <button
                disabled={isPendingModeChange || !cubeCount}
                onClick={() => {
                  if (!cubeCount || isPendingModeChange) return

                  setIsPendingModeChange(true)

                  socket?.emit('cube_setup_done', {
                    count: cubeCount,
                  })

                  onChangeGameMode('Player', Number(cubeCount))
                }}
                className={`bg-blue-500 py-2 rounded fixed bottom-4 left-1/2 cursor-pointer -translate-x-1/2 px-3 flex items-center gap-2 ${isPendingModeChange ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
              >
                {isPendingModeChange && <Loader2 size={16} className="animate-spin" />}
                {isPendingModeChange ? 'Changing to Player Mode...' : 'Go to Player Mode'}
              </button>
            </div>
          </div>
        )} */}

        {/*  SPAWN BUTTON */}
        {/* {isCubeSetupDone && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
            <button
              onClick={() => {
                sendToUE({
                  type: 'SPAWN_CUBES',
                })

                socket?.emit('spawn_cube', {
                  room_id: roomData.room_id,
                })
              }}
              className="px-6 py-3 bg-green-500 cursor-pointer hover:bg-green-600 text-white rounded-xl shadow-lg"
            >
              Spawn Cubes
            </button>
          </div>
        )} */}

        {/* STOP BUTTON */}
        {roomData.isHost && (
          <button
            className="danger session-exit-btn"
            onClick={onStopSession}
            style={{ zIndex: 20 }}
          >
            <X size={20} /> Stop Session
          </button>
        )}

        {/* USERS */}
        <div className="absolute top-[4.5rem] left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {users.map((u) => {
            const isSelf = u.socket_id === socket?.id
            const isHost = u.socket_id === roomData.host_id

            return (
              <div
                key={u.socket_id}
                style={{
                  background: isHost
                    ? 'rgba(251, 191, 36, 0.15)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: isHost
                    ? '1px solid rgba(251, 191, 36, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  color: isHost ? '#fbbf24' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: isSelf ? 'bold' : 'normal',
                }}
              >
                {isHost && <Crown size={14} />}
                {u.username} {isSelf && '(You)'}
              </div>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
