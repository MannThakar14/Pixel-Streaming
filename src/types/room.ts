export type RoomStatus = 'lobby' | 'pending' | 'in_room'

export interface RoomUser {
  socket_id: string
  username: string
}

export interface JoinRequest {
  socket_id: string
  username: string
  user_id: string
}

export interface RoomData {
  room_id: string
  host_id: string
  isHost: boolean
  game_mode?: string
}

export interface Position {
  x: number
  y: number
}

export type PositionMap = Record<string, Position>
