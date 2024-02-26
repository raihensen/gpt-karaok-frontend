"use client"
/* eslint-disable react-hooks/exhaustive-deps */

import { ApiResponse, Player, PlayerState, Session, SessionState, getSessionInvitationLink } from '@/src/types';
import { useInitEffect } from '@/components/utils';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from "react";
import { Alert, Badge, Button, Container, Form, Table } from "react-bootstrap";
import _ from "lodash";
import Logo from '@/components/Logo';
import { FaClipboard, FaCopy } from 'react-icons/fa6';

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
        
          <h4>Einladungs-Link</h4>
          <div className="mb-3">
            <Badge bg="secondary" className="text-monospace small ms-2 p-2 d-inline-flex align-items-center gap-1" style={{ cursor: "pointer" }} onClick={() => {
              navigator.clipboard.writeText(getSessionInvitationLink(session))
            }}>
              <FaCopy />
              {getSessionInvitationLink(session)}
            </Badge>
          </div>
          
          {session.players.length != 0 && (<>
            <h4>Spieler*innen</h4>
            <div className="mb-3">
              <Table striped>
                <tbody>
                  {session.players.map((p, i) => (
                    <tr key={i}>
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
