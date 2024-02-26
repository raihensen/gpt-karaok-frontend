import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { Session, SessionState, Player, PlayerState } from "@/src/types";
import { error, respond, refreshState } from "@/src/api.utils";
import { PrismaClient, Topic } from '@prisma/client'


export async function POST(
  req: NextRequest,
  { params }: { params: { session: string, player: string } }
) {
  const db = new PrismaClient()

  if (!params.session) return error(db, "Invalid request")
  const session = await db.session.findFirst({ where: { id: params.session }, include: { players: { include: { topics: true } } } })
  if (!session) return error(db, "Session not found", 404)

  if (!params.player) return error(db, "Invalid request")

  console.log("Player", params.player)
  console.log(JSON.stringify(session))
  const player = session.players.find(p => p.id == params.player)
  if (!player) return error(db, "Player not found", 404)
  if (!session.players.some(p => p.id == player.id)) return error(db, "Player not part of the session", 404)

  const data = await req.formData()
  const topicsDef = data.get("topics") as string
  if (!topicsDef) return error(db, "Invalid request")
  const topics = topicsDef.split(",").map(t => t.trim())

  await db.topic.deleteMany({ where: { playerId: player.id } })
  await db.topic.createMany({ data: topics.map(t => ({ name: t, playerId: player.id as Player["id"] })) })
  await db.player.update({ where: { id: player.id }, data: { state: PlayerState.SUBMITTED } })

  const player1 = await db.player.findUnique({ where: { id: player.id }, include: { topics: true } })
  if (!player1) return error(db, "Internal Server Error", 500)

  await refreshState(db, session)
  return respond(db, session, player1)

}

