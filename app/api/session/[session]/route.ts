import { NextRequest, NextResponse } from "next/server";
// import { Session, SessionState, Player, PlayerState } from "@/src/types";
import { error, respond, refreshState } from "@/src/api.utils";
import { PrismaClient, Topic } from '@prisma/client'


export async function GET(
  req: NextRequest,
  { params }: { params: { session: string } }
) {
  const db = new PrismaClient()

  const sessionKey = params.session

  if (!sessionKey) return error(db, "Invalid request")
  let session = await db.session.findFirst({ where: { key: sessionKey }, include: { players: { include: { topics: true } } } })
  if (!session) return error(db, "Session not found", 404)
  await refreshState(db, session)

  db.$disconnect()

  return NextResponse.json({
    ...session,
    success: true
  })

}
