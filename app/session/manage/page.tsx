"use client"
/* eslint-disable react-hooks/exhaustive-deps */

import { useSearchParams } from 'next/navigation'

import { ApiResponse, Player, PlayerState, Session, SessionState, getSessionInvitationLink } from '@/src/types';
import { useInitEffect } from '@/components/utils';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from "react";
import { Alert, Badge, Button, Container, Form, Table } from "react-bootstrap";
import _ from "lodash";
import Logo from '@/components/Logo';
import { FaCircleCheck, FaClipboard, FaCopy, FaHourglassHalf, FaPython } from 'react-icons/fa6';

export default function ManagePage({ params }: { params: { session: string } }) {

  const [error, setError] = useState<string>()

  const [session, setSession] = useState<Session>()
  const [speakers, setSpeakers] = useState<Player[]>()

  const searchParams = useSearchParams()
  useEffect(() => {
    async function effect() {
      const sessionId = searchParams.get('session')
      if (sessionId && !session) {
        const res = await fetch(`/api/session/${sessionId}`)
        const resData: ApiResponse<{ session: Session }> = await res.json()
        if (!resData.success) return setError(resData.error)
        setSession(resData.session)
      }
    }
    effect()
  }, [searchParams])


  // auto refresh
  useEffect(() => {
    const refresh = async () => {
      if (session) {
        const res = await fetch(`/api/session/${session.id}`, { method: "GET" })
        const resData: ApiResponse<{session: Session}> = await res.json()
        if (!resData.success) return setError(resData.error)
        setSession(resData.session)
      }
    }
    const handle = setInterval(refresh, 2000)
    return () => clearInterval(handle)
  }, [session])

  const handleClose = async () => {
    if (!session) return

    const data = new FormData()
    data.set("speakers", (speakers ?? session.players).map(sp => sp.id).join(","))
    const res = await fetch(`/api/session/${session.id}/close`, { method: "POST" , body: data })
    const resData: ApiResponse<{ session: Session }> = await res.json()
    if (!resData.success) return setError(resData.error)
    setSession(resData.session)
  }

  return (<>
    <header className="py-3 bg-light">
      <Container style={{ maxWidth: "480px" }}>
        <Logo />
      </Container>
    </header>
    <main className="py-3">
      <Container style={{ maxWidth: "480px" }}>

        {!!error && (<Alert variant="danger" dismissible>{error}</Alert>)}

        {!!session && (<>

          {session.state != SessionState.CLOSED && (<>
            <h4>Einladungs-Link</h4>
            <div className="mb-3">
              <Button variant="secondary" size="sm" style={{ fontSize: ".75em", fontFamily: "monospace" }} className="p-2 d-inline-flex align-items-center gap-1" onClick={() => {
                navigator.clipboard.writeText(getSessionInvitationLink(session))
              }}>
                <FaCopy />
                {getSessionInvitationLink(session)}
              </Button>
            </div>
            <div className="mb-3">
              <Button variant="warning" size="sm" className="p-2 d-inline-flex align-items-center gap-1" onClick={() => {
                navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_PYTHON_EXE_PATH} ${process.env.NEXT_PUBLIC_BACKEND_SCRIPT_PATH} ${session.id}`)
              }}>
                <FaPython />
                Python-Befehl kopieren
              </Button>
            </div>

            {session.players.length != 0 && (<>
              <div className="mb-3">
                <Button variant="success" onClick={handleClose} disabled={session.state != SessionState.READY}>Spiel starten</Button>
              </div>
              {(session.state != SessionState.READY && session.players.some(p => p.state == PlayerState.SUBMITTED)) && (<div className="mb-3">
                <p>
                  Es sind nicht alle Spieler*innen bereit.
                  <Button size="sm" variant="secondary" className="ms-1" onClick={handleClose}>Trotzdem starten</Button>
                </p>
              </div>)}
            </>)}

          </>)}

          {session.state == SessionState.CLOSED && (<>
            <Alert variant="success">Das Spiel startet ...</Alert>
          </>)}
          
          {session.players.length != 0 && (<>
            <h4>Spieler*innen</h4>
            <div className="mb-3">
              <Table striped>
                <thead>
                  <th></th>
                  <th>Name</th>
                  <th>Vortrag</th>
                  <th># Themen</th>
                </thead>
                <tbody>
                  {_.orderBy(session.players, p => [
                    p.state != PlayerState.SUBMITTED ? 0 : 1,
                    p.createdAt,
                    p.firstName,
                    p.lastName
                  ], ["asc", "desc", "asc"]).map((p, i) => (
                    <tr key={i}>
                      <td>
                        {p.state == PlayerState.JOINED && <FaHourglassHalf className="text-secondary" />}
                        {p.state == PlayerState.SUBMITTED && <FaCircleCheck className="text-success" />}
                      </td>
                      <td>{p.name}</td>
                      <td>
                        <Form.Check
                          checked={speakers?.some(sp => sp.id == p.id) ?? true}
                          onChange={e => {
                            setSpeakers(sps => [...(sps ?? session.players).filter(sp => sp.id != p.id), ...(e.target.checked ? [p] : [])])
                            // setSession(s => s ? ({ ...s, players: [{ ...p, isSpeaker: e.target.checked }, ...s.players.filter(p1 => p1.id != p.id)] }) : undefined)
                          }}
                          disabled={(speakers?.includes(p) ?? true) && speakers?.length == 1}
                        />
                      </td>
                      <td>{p.topics.length ? `${p.topics.length} Themen` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <p>{speakers?.map(sp => sp.name).join(", ")}</p>
            </div>
          </>)}


        </>)}

        {!session && (<>
        
          <Button onClick={async () => {
            const res = await fetch(`/api/session/create`, {
              method: "POST"
            })
            const resData: ApiResponse<{session: Session}> = await res.json()
            if (!resData.success) return setError(resData.error)
            setSession(resData.session)
          }}>Spiel erstellen</Button>

        </>)}


      </Container>

    </main>
  </>);
}
