export type Role = 'STUDENT' | 'DRIVER' | 'ADMIN' | 'SUPERADMIN'

export interface UserSummary {
  id: string
  tenantId: string
  email: string
  firstName: string
  lastName: string
  role: Role
  status: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: UserSummary
}

export type TripStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface Trip {
  id: string
  routeId: string
  routeName: string
  busId: string
  busPlateNumber: string
  driverId: string
  driverName: string
  tripDate: string
  scheduledDeparture: string
  scheduledArrival: string
  actualDeparture: string | null
  actualArrival: string | null
  status: TripStatus
  passengerCount: number
}

export interface RouteStop {
  stopId: string
  stopName: string
  latitude: number
  longitude: number
  sequenceOrder: number
  scheduledOffsetMinutes: number
}

export interface RouteDto {
  id: string
  name: string
  description: string | null
  estimatedDistanceKm: number | null
  stops: RouteStop[]
}

export type ReservationStatus = 'RESERVED' | 'VALIDATED' | 'CANCELLED' | 'NO_SHOW'

export interface Reservation {
  id: string
  tripId: string
  routeName: string
  studentId: string
  studentName: string
  boardingStopId: string
  boardingStopName: string
  alightingStopId: string
  alightingStopName: string
  qrCode: string
  status: ReservationStatus
  validatedAt: string | null
}

export type IncidentType = 'PANNE' | 'ACCIDENT' | 'EMBOUTEILLAGE' | 'AUTRE'
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface Incident {
  id: string
  tripId: string | null
  routeName: string | null
  reportedByUserId: string
  type: IncidentType
  description: string
  photoUrl: string | null
  severity: IncidentSeverity
  status: IncidentStatus
  occurredAt: string
}

export interface NotificationItem {
  id: string
  category: string
  title: string
  message: string
  channel: string
  read: boolean
  createdAt: string
}

export interface BusPosition {
  busId: string
  tripId: string | null
  latitude: number
  longitude: number
  speedKmh: number | null
  recordedAt: string
}

export interface HailEvent {
  tripId: string
  studentName: string
  stopName: string
  sentAt: string
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  details: string[] | null
}
