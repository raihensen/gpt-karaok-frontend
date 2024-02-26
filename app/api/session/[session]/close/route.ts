import { NextRequest, NextResponse } from "next/server";
// import { Session, SessionState, Player, PlayerState } from "@/src/types";
import { error, respond, refreshState } from "@/src/api.utils";
import { PrismaClient, Topic } from '@prisma/client'
import { generateInvitationCode } from "@/src/utils";
import { SessionState } from "@/src/types";


export async function GET(
  req: NextRequest,
  { params }: { params: { session: string } }
) {
  const db = new PrismaClient()

  const sessionId = params.session

  if (!sessionId) return error(db, "Invalid request")
  let session = await db.session.findFirst({ where: { id: sessionId }, include: { players: { include: { topics: true } } } })
  if (!session) return error(db, "Session not found", 404)

  session = await db.session.update({
    where: { id: sessionId },
    data: { state: SessionState.CLOSED },
    include: { players: { include: { topics: true } } }
  })

  db.$disconnect()

  return NextResponse.json({
    session: session,
    success: true
  })

}

