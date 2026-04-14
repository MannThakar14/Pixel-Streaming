import { createFileRoute } from '@tanstack/react-router'
import { RoomPage } from '@/components/room/RoomPage'

export const Route = createFileRoute('/room')({
  component: RoomPage,
})
