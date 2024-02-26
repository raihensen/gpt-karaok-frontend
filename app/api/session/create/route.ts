import { NextRequest, NextResponse } from "next/server";
// import { Session, SessionState, Player, PlayerState } from "@/src/types";
import { error, respond, refreshState } from "@/src/api.utils";
import { PrismaClient, Topic } from '@prisma/client'
import { generateInvitationCode } from "@/src/utils";
import { SessionState } from "@/src/types";

async function generateNewInvitationCode(db: PrismaClient) {
  for (let i = 0; i < 10; i++) {
    let invitationCode = generateInvitationCode()
    if (!await db.session.findFirst({
      where: {
        invitationCode: invitationCode,
        state: { not: SessionState.CLOSED }
      }
    })) {
      return invitationCode
    }
  }
  return false
}


export async function GET(
  req: NextRequest,
  { params }: { params: {} }
) {
  const db = new PrismaClient()

  const invitationCode = await generateNewInvitationCode(db)
  if (!invitationCode) return error(db, "Internal Server Error", 500)
  const newSession = await db.session.create({
    data: {
      invitationCode: generateInvitationCode(),
      state: SessionState.INIT
    }
  })
  const session = await db.session.findUnique({ where: { id: newSession.id }, include: { players: { include: { topics: true } } } })
  if (!session) return error(db, "Internal Server Error", 500)

  db.$disconnect()

  return NextResponse.json({
    session: session,
    success: true
  })

}

