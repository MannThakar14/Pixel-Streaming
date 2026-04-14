import * as React from 'react'
import { Button } from '@/components/ui/button.tsx'
import { usePixelStreamingStore } from '@/store/pixelStreamingStore.ts'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'

export const SessionSwitcher: React.FC = () => {
  const streaming = usePixelStreamingStore(useShallow(s => s.pixelStreaming))

  const onStartSession = React.useCallback(() => {
    if (!streaming) {
      toast.error('Pixel Streaming is not initialized')
      return
    }

    const payload = {
      message: {
        type: 'create join',
        session_id: '',
      },
    }

    console.log('Sending session payload:', payload)
    streaming.emitUIInteraction(payload)
    toast.success('Session start request sent')
  }, [streaming])

  return (
    <div className="absolute top-5 right-5 p-4 bg-background border rounded-lg shadow-sm">
      <Button onClick={onStartSession} variant="default">
        Start New Session
      </Button>
    </div>
  )
}
