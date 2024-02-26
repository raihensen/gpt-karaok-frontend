"use client"
/* eslint-disable react-hooks/exhaustive-deps */

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

  // auto refresh
  useEffect(() => {
    const refresh = async () => {
      if (session) {
        const res = await fetch(`/api/session/${session.id}`)
        const resData: ApiResponse<{session: Session}> = await res.json()
        if (!resData.success) return setError(resData.error)
        setSession(resData.session)
      }
    }
    const handle = setInterval(refresh, 2000)
    return () => clearInterval(handle)
  }, [session])

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
                <Button variant="success" onClick={async () => {
                  const res = await fetch(`/api/session/${session.id}/close`)
                  const resData: ApiResponse<{ session: Session }> = await res.json()
                  if (!resData.success) return setError(resData.error)
                  setSession(resData.session)
                }} disabled={session.state != SessionState.READY}>Spiel starten</Button>
              </div>
              {session.state != SessionState.READY && (<div className="mb-3">
                <p>
                  Es sind nicht alle Spieler*innen bereit.
                  <Button size="sm" variant="secondary" className="ms-1" onClick={async () => {
                    const res = await fetch(`/api/session/${session.id}/close`)
                    const resData: ApiResponse<{ session: Session }> = await res.json()
                    if (!resData.success) return setError(resData.error)
                    setSession(resData.session)
                  }}>Trotzdem starten</Button>
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
                <tbody>
                  {_.orderBy(session.players, p => [
                    p.state != PlayerState.SUBMITTED ? 0 : 1,
                    p.createdAt,
                    p.name
                  ], ["asc", "desc", "asc"]).map((p, i) => (
                    <tr key={i}>
                      <td>
                        {p.state == PlayerState.JOINED && <FaHourglassHalf className="text-secondary" />}
                        {p.state == PlayerState.SUBMITTED && <FaCircleCheck className="text-success" />}
                      </td>
                      <td>{p.name}</td>
                      <td>{p.topics.length ? `${p.topics.length} Themen` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>)}


        </>)}

        {!session && (<>
        
          <Button onClick={async () => {
            const res = await fetch(`/api/session/create`, {
              method: "GET"
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
