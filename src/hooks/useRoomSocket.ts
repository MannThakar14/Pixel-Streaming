import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import type {
  RoomStatus,
  RoomUser,
  JoinRequest,
  RoomData,
  PositionMap,
} from '@/types/room'

function generateUUID(): string {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => {
      const n = Number(c)
      return (
        n ^
        (globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))
      ).toString(16)
    })
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const SOCKET_SERVER = 'http://192.168.1.41:7000'
// TODO: Remove this when done testing
// const SOCKET_SERVER = 'https://19b7-122-172-240-193.ngrok-free.app/'

interface UseRoomSocketReturn {
  socket: Socket | null
  username: string
  setUsername: (v: string) => void
  joinRoomId: string
  setJoinRoomId: (v: string) => void
  status: RoomStatus
  setStatus: (v: RoomStatus) => void
  roomData: RoomData | null
  users: RoomUser[]
  requests: JoinRequest[]
  positions: PositionMap
  sessionStarted: boolean
  sessionStarting: boolean
  error: string
  setError: (v: string) => void
  createRoom: () => void
  joinRoom: () => void
  approveUser: (socket_id: string, persistent_user_id: string) => void
  rejectUser: (socket_id: string) => void
  startSession: () => void
  stopSession: () => void
  changeGameMode: (game_mode: string, num_cubes?: number) => void
}

export function useRoomSocket(): UseRoomSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const [username, setUsername] = useState<string>(
    () => sessionStorage.getItem('username') ?? '',
  )
  const [user_id] = useState<string>(
    () => sessionStorage.getItem('userId') ?? generateUUID(),
  )
  const [positions, setPositions] = useState<PositionMap>({})
  const [status, setStatus] = useState<RoomStatus>('lobby')
  const [roomData, setRoomData] = useState<RoomData | null>(null)
  const [error, setError] = useState<string>('')
  const [joinRoomId, setJoinRoomId] = useState<string>('')
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [users, setUsers] = useState<RoomUser[]>([])
  const [sessionStarted, setSessionStarted] = useState<boolean>(false)
  const [sessionStarting, setSessionStarting] = useState<boolean>(false)

  // Persist username & userId to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('username', username)
    sessionStorage.setItem('userId', user_id)
  }, [username, user_id])

  // Socket connection + event listeners
  useEffect(() => {
    const newSocket = io(SOCKET_SERVER)

    // TODO: Remove this when done testing
    // const newSocket = io(SOCKET_SERVER, {
    //   transports: ["websocket"],
    // });
    socketRef.current = newSocket
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('Connected!', newSocket.id)
    })

    newSocket.on('backend_event', ({ event_name, data }: { event_name: string; data: any }) => {

      console.log(event_name, data);

      switch (event_name) {
        case 'room_created': {
          const { room_id, host_id } = data
          setRoomData({ room_id, host_id, isHost: true })
          setStatus('in_room')
          setUsers([{ socket_id: host_id, username: username || 'Host' }])
          break
        }

        case 'join_request': {
          const { socket_id, username: reqUsername, user_id: reqUserId } = data
          setRequests((prev) => [...prev, { socket_id, username: reqUsername, user_id: reqUserId }])
          break
        }

        case 'join_approved': {
          const { room_id, host_id, users: initialUsers } = data
          setRoomData({ room_id, host_id, isHost: false })
          setUsers(initialUsers ?? [])
          setStatus('in_room')
          setError('')
          break
        }

        case 'join_rejected': {
          const { reason } = data
          setStatus('lobby')
          setError(reason)
          break
        }

        case 'user_joined': {
          const { socket_id, username: joinedUsername } = data
          setUsers((prev) => {
            if (prev.find((u) => u.socket_id === socket_id)) return prev
            return [...prev, { socket_id, username: joinedUsername }]
          })
          break
        }

        case 'user_left': {
          const { socket_id } = data
          setUsers((prev) => prev.filter((u) => u.socket_id !== socket_id))
          break
        }

        case 'new_host': {
          const { host_id } = data
          setRoomData((prev) =>
            prev ? { ...prev, host_id, isHost: host_id === newSocket.id } : prev,
          )
          break
        }

        case 'session_started': {
          setSessionStarted(true)
          setSessionStarting(false)
          break
        }

        case 'session_starting': {
          const { room_id, request_id, message } = data
          console.log('Session starting:', { room_id, request_id, message })
          toast.info(message || 'Host is starting session. Approved users are waiting.')

          setSessionStarting(true)
          break
        }

        case 'game_mode_changing': {
          const { game_mode, message } = data
          toast.info(message || `Game mode is changing to ${game_mode}`)
          break
        }

        case 'game_mode_changed': {
          const { game_mode, message } = data
          setRoomData((prev) => (prev ? { ...prev, game_mode } : prev))
          toast.success(message || `Game mode changed to ${game_mode}`)
          break
        }

        case 'game_mode_change_failed': {
          const { message } = data
          toast.error(message || 'Failed to change game mode')
          break
        }

        case 'session_stopped': {
          setSessionStarted(false)
          setSessionStarting(false)
          setPositions({})
          break
        }

        case 'room_closed': {
          const { message } = data

          console.log('Room closed:', data)

          toast.error(message || 'Room closed by host')

          // Reset everything
          setStatus('lobby')
          setRoomData(null)
          setUsers([])
          setRequests([])
          setPositions({})
          setSessionStarted(false)
          setSessionStarting(false)

          break
        }

        case 'join_request_failed': {
          const { message } = data

          console.log('Join request failed:', data)

          setStatus('lobby')
          setError(message)
          toast.error(message || 'Failed to join room')

          break
        }

        case 'join_request_sent': {
          const { message } = data

          console.log('Join request sent:', data)

          setStatus('pending')
          setError('')
          toast.info(message || 'Waiting for host approval...')

          break
        }

        case 'position_updated': {
          const { socket_id, x, y } = data
          setPositions((prev) => ({ ...prev, [socket_id]: { x, y } }))
          break
        }

        case 'error': {
          const { message } = data
          setError(message)
          break
        }

        default:
          console.warn('Unhandled backend event:', event_name, data)
      }
    })

    return () => {
      socketRef.current = null
      newSocket.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user_id])

  // Mouse position tracking
  useEffect(() => {
    if (!socket || !roomData) return
    if (status !== 'in_room' && !sessionStarted) return

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      setPositions((prev) => ({ ...prev, [socket.id!]: { x, y } }))
      socket.emit('update_position', { room_id: roomData.room_id, x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [status, socket, roomData, sessionStarted])

  const createRoom = useCallback(() => {
    if (!username) return setError('Please enter a username')
    const host_ip = window.location.hostname || '127.0.0.1'

    socket?.emit('create_room', { username, user_id, host_ip, host_port: 3000 })
  }, [socket, username, user_id])

  const joinRoom = useCallback(() => {
    if (!username) return setError('Please enter a username')
    if (!joinRoomId) return setError('Please enter a Room ID')
    socket?.emit('join_room_request', { room_id: joinRoomId, username, user_id })
    setStatus('pending')
    setError('')
  }, [socket, username, user_id, joinRoomId])

  const approveUser = useCallback(
    (socket_id: string, persistent_user_id: string) => {
      socket?.emit('approve_user', {
        room_id: roomData?.room_id,
        target_socket_id: socket_id,
        user_id: persistent_user_id,
      })

      const req = requests.find((r) => r.socket_id === socket_id)
      if (req) {
        setUsers((prev) => {
          if (prev.find((u) => u.socket_id === socket_id)) return prev
          return [...prev, { socket_id: socket_id, username: req.username }]
        })
      }

      setRequests((prev) => prev.filter((r) => r.socket_id !== socket_id))
    },
    [socket, roomData, requests],
  )

  const rejectUser = useCallback(
    (socket_id: string) => {
      socket?.emit('reject_user', { room_id: roomData?.room_id, target_socket_id: socket_id, user_id: socket_id })
      setRequests((prev) => prev.filter((r) => r.socket_id !== socket_id))
    },
    [socket, roomData],
  )

  const sessionStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startSession = useCallback(() => {
    if (sessionStarting || sessionStarted) return

    const currentSocket = socketRef.current
    const roomId = roomData?.room_id

    console.log('[startSession] Emitting start_session', {
      hasSocket: !!currentSocket,
      socketId: currentSocket?.id,
      roomId,
      sessionStarting,
      sessionStarted,
    })

    if (!currentSocket?.connected) {
      console.error('[startSession] Socket is not connected!')
      toast.error('Socket not connected. Please refresh and try again.')
      return
    }

    currentSocket.emit('start_session', { room_id: roomId })

    // Safety timeout: if session_started never arrives within 15s, reset the starting state
    // so the host can retry
    if (sessionStartTimeoutRef.current) clearTimeout(sessionStartTimeoutRef.current)
    sessionStartTimeoutRef.current = setTimeout(() => {
      setSessionStarting((prev) => {
        if (prev) {
          console.warn('[startSession] Timed out waiting for session_started, resetting...')
          toast.warning('Session start timed out. You can try again.')
        }
        return false
      })
    }, 15_000)
  }, [roomData, sessionStarting, sessionStarted])

  // Clear the timeout when session actually starts
  useEffect(() => {
    if (sessionStarted && sessionStartTimeoutRef.current) {
      clearTimeout(sessionStartTimeoutRef.current)
      sessionStartTimeoutRef.current = null
    }
  }, [sessionStarted])

  const stopSession = useCallback(() => {
    socketRef.current?.emit('stop_session', { room_id: roomData?.room_id })
  }, [roomData])

  const changeGameMode = useCallback(
    (game_mode: string, num_cubes?: number) => {
      socketRef.current?.emit('change_game_mode', {
        room_id: roomData?.room_id,
        game_mode,
        no_of_cubes: num_cubes,
      })
    },
    [roomData],
  )

  return {
    socket,
    username,
    setUsername,
    joinRoomId,
    setJoinRoomId,
    status,
    setStatus,
    roomData,
    users,
    requests,
    positions,
    sessionStarted,
    error,
    setError,
    createRoom,
    joinRoom,
    approveUser,
    rejectUser,
    startSession,
    sessionStarting,
    stopSession,
    changeGameMode,
  }
}
