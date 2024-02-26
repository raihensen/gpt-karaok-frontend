import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { Session, SessionState, Player, PlayerState } from "@/src/types";
import { error, respond, refreshState } from "@/src/api.utils";
import { PrismaClient, Topic } from '@prisma/client'


export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const db = new PrismaClient()

  const data = await req.formData()
  
  if (!params.code) return error(db, "Invalid request", 400)
  const session = await db.session.findFirst({ where: { invitationCode: params.code }, include: { players: { include: { topics: true } } } })
  if (!session) return error(db, "Session not found", 404)
  
  const name = data.get("name") as string
  if (!name) return error(db, "Missing name", 400)
  if (session.players.some(p => p.name == name)) return error(db, `Pick another name, ${name} is already playing!`)

  const newPlayer = await db.player.create({
    data: {
      name: name,
      state: PlayerState.JOINED,
      sessionId: session.id
    }
  })
  const player = await db.player.findUnique({ where: { id: newPlayer.id }, include: { topics: true }})
  if (!player) return error(db, "Internal Server Error", 500)

  await refreshState(db, session)
  return respond(db, session, player)

}

