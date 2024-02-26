import { NextRequest, NextResponse } from "next/server";
// import { Session, SessionState, Player, PlayerState } from "@/src/types";
import { error, respond, refreshState } from "@/src/api.utils";
import { PrismaClient, Topic } from '@prisma/client'


export async function GET(
  req: NextRequest,
  { params }: { params: { session: string } }
) {
  const db = new PrismaClient()

  const sessionId = params.session

  if (!sessionId) return error(db, "Invalid request")
  const session = await db.session.findFirst({ where: { id: sessionId }, include: { players: { include: { topics: true } } } })

  // TODO remove session creation
  // if (!session) return error(db, "Session not found", 404)
  // if (!session) {
  //   const newSession = await db.session.create({ data: { invitationCode: invitationCode }})
  //   console.log(`Creating new session with invitationCode ${invitationCode}`)
  //   session = await db.session.findUnique({ where: { id: newSession.id }, include: { players: { include: { topics: true } } } })
  // }
  if (!session) return error(db, "Session could not be created", 400)

  await refreshState(db, session)
  return respond(db, session)

}

