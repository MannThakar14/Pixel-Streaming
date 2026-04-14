import { AnimatePresence } from 'framer-motion'
import '@/styles/room.css'
import { useRoomSocket } from '@/hooks/useRoomSocket'
import { Lobby } from './Lobby'
import { PendingApproval } from './PendingApproval'
import { RoomView } from './RoomView'
import { LiveSession } from './LiveSession'
// import { dummyRoomData, dummyUsers, MOCK_MODE } from '@/utils/constant'

export function RoomPage() {
  const {
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
    sessionStarted,
    error,
    setError,
    createRoom,
    joinRoom,
    approveUser,
    rejectUser,
    startSession,
    stopSession,
    sessionStarting,
    changeGameMode,
  } = useRoomSocket()

  // const socketData = useRoomSocket()

  // const {
  //   socket,
  //   username,
  //   setUsername,
  //   joinRoomId,
  //   setJoinRoomId,
  //   setStatus,
  //   error,
  //   setError,
  //   createRoom,
  //   joinRoom,
  //   approveUser,
  //   rejectUser,
  //   startSession,
  //   stopSession,
  //   sessionStarting,
  //   changeGameMode,
  // } = socketData

  // // 👇 override values in mock mode
  // const status = MOCK_MODE ? 'in_room' : socketData.status
  // const users = MOCK_MODE ? dummyUsers : socketData.users
  // const roomData = MOCK_MODE ? dummyRoomData : socketData.roomData
  // const sessionStarted = MOCK_MODE ? true : socketData.sessionStarted
  // const requests = MOCK_MODE ? [] : socketData.requests

  return (
    <div className="room-container">
      <AnimatePresence mode="wait">
        {status === 'lobby' && (
          <Lobby
            username={username}
            setUsername={setUsername}
            joinRoomId={joinRoomId}
            setJoinRoomId={setJoinRoomId}
            error={error}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
          />
        )}

        {status === 'pending' && (
          <PendingApproval
            joinRoomId={joinRoomId}
            onCancel={() => {
              setStatus('lobby')
              setError('')
            }}
          />
        )}

        {status === 'in_room' && roomData && (
          <RoomView
            roomData={roomData}
            users={users}
            requests={requests}
            socket={socket}
            username={username}
            sessionStarted={sessionStarted}
            onApprove={approveUser}
            onReject={rejectUser}
            onStartSession={startSession}
            sessionStarting={sessionStarting}
          />
        )}
      </AnimatePresence>

      {sessionStarted && roomData && (
        <LiveSession
          users={users}
          roomData={roomData}
          socket={socket}
          onStopSession={stopSession}
          onChangeGameMode={changeGameMode}
        />
      )}
    </div>
  )
}
