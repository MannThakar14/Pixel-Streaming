import { useEffect, useRef, useState } from 'react';
import {
  Config,
  type AllSettings,
  PixelStreaming,
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.4'
import { usePixelStreamingStore } from '@/store/pixelStreamingStore.ts'
import { useShallow } from 'zustand/react/shallow'

export interface PixelStreamingWrapperProps {
    initialSettings?: Partial<AllSettings>;
}

export const PixelStreamingWrapper = ({initialSettings}: PixelStreamingWrapperProps) => {
    // A reference to parent div element that the Pixel Streaming library attaches into:
    const videoParent = useRef<HTMLDivElement>(null);

    // Pixel streaming library instance is stored into this state variable after initialization:

    const [
      pixelStreaming,
      setPixelStreaming,
      setConnectionStatus,
      reconnectTrigger,
    ] = usePixelStreamingStore(
      useShallow((s) => [
        s.pixelStreaming,
        s.setPixelStreaming,
        s.setConnectionStatus,
        s.reconnectTrigger,
      ]),
    )

    // A boolean state variable that determines if the Click to play overlay is shown:
    const [clickToPlayVisible, setClickToPlayVisible] = useState(false);

    // Track the streaming instance so we can tear it down on reconnect
    const streamingRef = useRef<PixelStreaming | null>(null);

    /** Create and wire up a fresh PixelStreaming instance */
    const initStreaming = () => {
      if (!videoParent.current) return;

      // Tear down any previous instance
      if (streamingRef.current) {
        try { streamingRef.current.disconnect(); } catch {}
        streamingRef.current = null;
      }

      // Clear old video elements that the library may have left behind
      if (videoParent.current) {
        videoParent.current.innerHTML = '';
      }

      setConnectionStatus('connecting');

      const config = new Config({ initialSettings });
      const streaming = new PixelStreaming(config, {
        videoElementParent: videoParent.current,
      });

      // ── Connection lifecycle events ──────────────────────────
      streaming.addEventListener('webRtcConnected', () => {
        console.log('[PS] WebRTC connected');
        setConnectionStatus('connected');
      });

      streaming.addEventListener('webRtcDisconnected', () => {
        console.log('[PS] WebRTC disconnected');
        setConnectionStatus('disconnected');
      });

      streaming.addEventListener('webRtcFailed', () => {
        console.log('[PS] WebRTC failed');
        setConnectionStatus('disconnected');
      });

      streaming.addEventListener('playStreamRejected', () => {
        setClickToPlayVisible(true);
      });

      // Video stream started = definitely connected
      streaming.addEventListener('playStream', () => {
        console.log('[PS] Stream playing');
        setConnectionStatus('connected');
      });

      streamingRef.current = streaming;
      setPixelStreaming(streaming);
    };

    // Run on component mount:
    useEffect(() => {
      initStreaming();

      // Clean up on component unmount:
      return () => {
        if (streamingRef.current) {
          try { streamingRef.current.disconnect(); } catch {}
        }
      };
    }, []);

    // React to reconnect triggers from the store (driven by retry logic)
    useEffect(() => {
      // Skip the initial render (trigger starts at 0)
      if (reconnectTrigger === 0) return;
      console.log('[PS] Reconnect triggered, attempt:', reconnectTrigger);
      initStreaming();
    }, [reconnectTrigger]);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                position: 'relative'
            }}
        >
            <div
                style={{
                    width: '100%',
                    height: '100%'
                }}
                ref={videoParent}
            />
            {clickToPlayVisible && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        pixelStreaming?.play();
                        setClickToPlayVisible(false);
                    }}
                >
                    <div>Click to play</div>
                </div>
            )}
        </div>
    );
};
