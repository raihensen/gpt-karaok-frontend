import { Prisma } from "@prisma/client"

export type ApiResponse<T> = {
  success: false
  error: string
} | ({
  success: true,
  session: Omit<Session, "players"> & { numPlayers: number },
  player: Player,
  playerState: PlayerState
} & T)

// export type Player = {
//   id: string
//   name: string
//   state: PlayerState
//   topics?: string[]
// }

// export type Session = {
//   id: string
//   state: SessionState
//   players: Player[]
// }
const sessionWithPlayers = Prisma.validator<Prisma.SessionDefaultArgs>()({
  include: {
    players: { include: { topics: true } }
  },
})
const playerWithTopics = Prisma.validator<Prisma.PlayerDefaultArgs>()({
  include: { topics: true },
})

export type Session = Omit<Prisma.SessionGetPayload<typeof sessionWithPlayers>, "state"> & { state: SessionState }
export type Player = Omit<Prisma.PlayerGetPayload<typeof playerWithTopics>, "state"> & { state: PlayerState }

export enum PlayerState {
  JOINING = 0,
  JOINED = 1,
  SUBMITTED = 2
}

export enum SessionState {
  INIT = 0,  // players are still preparing / joining
  READY = 1,  // all players submitted their data
  CLOSED = 2  // The game has been started and cannot be joined any more
}

export function getSessionInvitationLink(session: Session) {
  return `${process.env.NEXT_PUBLIC_DOMAIN}/session/${session.invitationCode}/join`
}
