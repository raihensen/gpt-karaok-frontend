
import { NextRequest, NextResponse } from "next/server";
import { Session, Player, PlayerState, SessionState } from "./types";
import { db } from "@/src/db";


export function error(msg: string, status: number = 400) {

  return NextResponse.json({
    error: msg,
    success: false
  }, {
    status: status
  })
}

export function respond(session: Session, player?: Player | undefined) {

  const { players, ...sessionWithoutPlayers } = session

  return NextResponse.json({
    success: true,
    session: {
      ...sessionWithoutPlayers,
      numPlayers: session.players.length
    },
    ...(player ? {
      player: player
    } : {})
  })

}

export async function refreshState(session: Session) {
  if (session.state == SessionState.CLOSED) {
    return
  }

  let newState = SessionState.INIT
  if (session.players.length != 0 && session.players.every(p => p.state == PlayerState.SUBMITTED)) {
    newState = SessionState.READY
  }
  if (session.state != newState) {
    await db.session.update({ where: { id: session.id }, data: { state: newState }})
  }

}

