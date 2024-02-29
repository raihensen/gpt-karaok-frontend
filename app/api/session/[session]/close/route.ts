import { NextRequest, NextResponse } from "next/server";
// import { Session, SessionState, Player, PlayerState } from "@/src/types";
import { error, respond, refreshState } from "@/src/api.utils";
import { PrismaClient, Topic } from '@prisma/client'
import { generateInvitationCode } from "@/src/utils";
import { SessionState } from "@/src/types";
import { db } from "@/src/db";


export async function POST(
  req: NextRequest,
  { params }: { params: { session: string } }
) {
  // POST to avoid caching

  const sessionId = params.session

  if (!sessionId) return error("Invalid request")
  let session = await db.session.findFirst({ where: { id: sessionId }, include: { players: { include: { topics: true } } } })
  if (!session) return error("Session not found", 404)

  const data = await req.formData()
  const speakerIds = (data.get("speakers") as string)?.split(",")
  if (!speakerIds) return error("Invalid request")
  // const gameMode = data.get("gameMode")
  // if (gameMode === null) return error("Invalid request")

  session = await db.session.update({
    where: { id: sessionId },
    // data: { state: SessionState.CLOSED, gameMode: Number(gameMode) },
    data: { state: SessionState.CLOSED },
    include: { players: { include: { topics: true } } }
  })
  session.players.forEach(async p => {
    await db.player.update({
      where: { id: p.id },
      data: { isSpeaker: speakerIds.includes(p.id)}
    })
  })

  return NextResponse.json({
    session: session,
    success: true
  })

}

