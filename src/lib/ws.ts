import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { API_BASE_URL } from '@/lib/api'
import type { BusPosition, HailEvent } from '@/types'

// Native clients skip SockJS entirely and speak STOMP over a plain WebSocket —
// see backend WebSocketConfig's `/ws-native` endpoint (registered alongside the
// SockJS `/ws` endpoint the web app uses).
const WS_URL = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/v1$/, '/ws-native')

/** Subscribes to every bus position update tenant-wide. */
export function useLiveBusPositions() {
  const [positions, setPositions] = useState<Record<string, BusPosition>>({})
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 4000,
      onConnect: () => {
        client.subscribe('/topic/positions', (message) => {
          const position = JSON.parse(message.body) as BusPosition
          setPositions((prev) => ({ ...prev, [position.busId]: position }))
        })
      },
    })
    client.activate()
    clientRef.current = client
    return () => {
      client.deactivate()
    }
  }, [])

  return positions
}

/** Subscribes to a single trip's position updates (e.g. the student's boarded trip). */
export function useTripPosition(tripId: string | null) {
  const [position, setPosition] = useState<BusPosition | null>(null)

  useEffect(() => {
    if (!tripId) return
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 4000,
      onConnect: () => {
        client.subscribe(`/topic/trips/${tripId}`, (message) => {
          setPosition(JSON.parse(message.body) as BusPosition)
        })
      },
    })
    client.activate()
    return () => {
      client.deactivate()
    }
  }, [tripId])

  return position
}

/** Subscribes to real-time "student wants to stop here" signals for a trip (driver side). */
export function useTripHail(tripId: string | null, onHail: (event: HailEvent) => void) {
  useEffect(() => {
    if (!tripId) return
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 4000,
      onConnect: () => {
        client.subscribe(`/topic/trips/${tripId}/hail`, (message) => {
          onHail(JSON.parse(message.body) as HailEvent)
        })
      },
    })
    client.activate()
    return () => {
      client.deactivate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])
}
