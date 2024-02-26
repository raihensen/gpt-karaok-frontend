import { NextRequest, NextResponse } from "next/server";
// import { Session, SessionState, Player, PlayerState } from "@/src/types";
import { error, respond, refreshState } from "@/src/api.utils";
import { PrismaClient, Topic } from '@prisma/client'
import { generateInvitationCode } from "@/src/utils";
import { SessionState } from "@/src/types";


export async function GET(
  req: NextRequest,
  { params }: { params: { } }
) {
  const db = new PrismaClient()
  
  const newSession = await db.session.create({ data: {
    invitationCode: generateInvitationCode(),
    state: SessionState.INIT
  } })
  const session = await db.session.findUnique({ where: { id: newSession.id }, include: { players: { include: { topics: true } } } })
  if (!session) return error(db, "Internal Server Error", 500)

  db.$disconnect()

  return NextResponse.json({
    session: session,
    success: true
  })

}

