import * as React from 'react'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Button } from '@/components/ui/button.tsx'
import { useCallback, useState } from 'react'
import { usePixelStreamingStore } from '@/store/pixelStreamingStore.ts'
import { useShallow } from 'zustand/react/shallow'
// {"lat":39.734165, "long":-105.254308,

// lng: 54.37814315660545,
//   lat: 24.480457672401002,
export const FlyToPanel: React.FC = () => {
  const [lat, setLat] = useState<number>()
  const [lng, setLng] = useState<number>()
  const [height, setHeight] = useState<number>(1000)
  const streaming = usePixelStreamingStore(useShallow(s => s.pixelStreaming))

  const onSubmit = useCallback(() => {
    console.log(lat, lng)
    streaming?.emitUIInteraction({
      lng,
      lat,
      height,
      type: 'test',
    })
  }, [streaming, lat, lng, height])

  const setLatLng = useCallback((lat: number, lng: number, height: number = 1000) => {
    setLat(lat)
    setLng(lng)
    setHeight(height)
  }, [])

  return (
    <FieldGroup className="absolute top-5 left-5 w-80 p-4 bg-background">
      <Field>
        <FieldLabel>Lat</FieldLabel>
        <Input
          value={lat}
          type="number"
          onChange={(e) => setLat(e.target.valueAsNumber)}
        />
      </Field>
      <Field>
        <FieldLabel>Lng</FieldLabel>
        <Input
          value={lng}
          type="number"
          onChange={(e) => setLng(e.target.valueAsNumber)}
        />
      </Field>
      <Button onClick={onSubmit}>Fly To</Button>
      <div className="space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setLatLng(39.734165, -105.261308, 2200)}
        >
          Origin
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setLatLng(24.480457672401002, 54.37814315660545)}
        >
          Abu Dhabi
        </Button>
      </div>
    </FieldGroup>
  )
}