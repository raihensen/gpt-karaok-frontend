import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { Session, SessionState, Player, PlayerState } from "@/src/types";
import { error, respond, refreshState } from "@/src/api.utils";
import { PrismaClient, Topic } from '@prisma/client'


export async function GET(
  req: NextRequest,
  { params }: { params: { session: string, player: string } }
) {
  const db = new PrismaClient()

  if (!params.session) return error(db, "Invalid request")
  const session = await db.session.findFirst({ where: { id: params.session }, include: { players: { include: { topics: true } } } })
  if (!session) return error(db, "Session not found", 404)

  if (!params.player) return error(db, "Invalid request")
  const player = session.players.find(p => p.id == params.player)
  if (!player) return error(db, "Player not found", 404)

  return respond(db, session, player)


}

