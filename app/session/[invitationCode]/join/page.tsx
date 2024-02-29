"use client"
/* eslint-disable react-hooks/exhaustive-deps */

import { ApiResponse, Player, PlayerState, SessionState } from '@/src/types';
import { useInitEffect } from '@/components/utils';
import 'bootstrap/dist/css/bootstrap.min.css';
import { setDefaultResultOrder } from 'dns';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from "react";
import { Alert, Button, Container, Form } from "react-bootstrap";
import _ from "lodash";
import Logo from '@/components/Logo';

export default function JoinPage({ params }: { params: { invitationCode: string } }) {

  const [error, setError] = useState<string>()

  const [sessionId, setSessionId] = useState<string>()
  const [invitationCode, setInvitationCode] = useState<string>()
  const [sessionState, setSessionState] = useState<SessionState | undefined>(undefined)
  const [player, setPlayer] = useState<Player>()

  // input states
  const [firstName, setFirstName] = useState<string>()
  const [lastName, setLastName] = useState<string>()
  const [topics, setTopics] = useState<string[]>([])

  // get session id from URL params
  useEffect(() => {
    if (params.invitationCode) {
      setInvitationCode(params.invitationCode)
      setSessionState(SessionState.INIT)
    }
  }, [])

  // auto refresh
  useEffect(() => {
    const refresh = async () => {
      if (sessionId) {
        const res = await fetch(`/api/session/${sessionId}` + (player ? `/player/${player.id}` : "") + "/refresh", { method: "POST" })
        const resData: ApiResponse<{}> = await res.json()
        if (!resData.success) return setError(resData.error)
        if (resData.player) {
          setPlayer(resData.player)
        }
        setSessionId(resData.session.id)
        setSessionState(resData.session.state)
      }
    }
    const handle = setInterval(refresh, 2000)
    return () => clearInterval(handle)
  }, [invitationCode, player])

  // logo animation
  const [logoState, setLogoState] = useState<"gpt" | "ppt">("ppt")
  useInitEffect(() => {
    toggleLogo()
  }, [])
  const toggleLogo = () => {
    const [a, b] = [250, 2000]
    const t = a + Math.random() * (b - a)
    setLogoState(prev => prev == "ppt" ? "gpt" : "ppt")
    setTimeout(toggleLogo, t)
  }

  const isTopicValid = (t: string) => {
    return t.length > 0 && t.length <= 100 && t.split(" ").length <= 10
  }

  return (<>
    <header className="py-3 bg-light">
      <Container style={{ maxWidth: "480px" }}>
        <Logo />
      </Container>
    </header>
    <main className="py-3" style={{
      fontFamily: "Comic Sans MS"
    }}>
      <Container className="d-flex flex-column gap-3" style={{ maxWidth: "480px" }}>

        {!!error && (<Alert variant="danger" dismissible>{error}</Alert>)}

        {(!player || player.state == PlayerState.JOINING) && (<>
          <Form onSubmit={async e => {
            e.preventDefault()
            if (invitationCode && firstName?.length && lastName?.length) {
              const data = new FormData()
              data.set("firstName", firstName)
              data.set("lastName", lastName)
              const res = await fetch(`/api/session/code/${invitationCode}/join`, {
                method: "POST",
                body: data
              })
              const resData: ApiResponse<{}> = await res.json()
              if (!resData.success) return setError(resData.error)
              setPlayer(resData.player)
              setSessionState(resData.session.state)
              setSessionId(resData.session.id)
            }
          }}>
            <Form.Group className="mb-2">
              <Form.Control value={firstName ?? ""} placeholder="Vorname" onChange={e => setFirstName(e.target.value)} disabled={!invitationCode}></Form.Control>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control value={lastName ?? ""} placeholder="Nachname" onChange={e => setLastName(e.target.value)} disabled={!invitationCode}></Form.Control>
            </Form.Group>
            <Form.Group>
              <Button type="submit" disabled={!(invitationCode && firstName?.length && lastName?.length)}>Beitreten</Button>
            </Form.Group>
          </Form>
        </>)}

        {(player?.state == PlayerState.JOINED) && (<>
          <h4>Hey {player.firstName}!</h4>
          <Form className="d-flex flex-column gap-2" onSubmit={async e => {
            e.preventDefault()
            if (sessionId && player && topics.length) {

              const nonEmptyTopics = topics.filter(t => t.length > 0)
              // t.match(/^[A-zÀ-ú]+$/)
              const validTopics = topics.filter(isTopicValid)
              if (validTopics.length < nonEmptyTopics.length)
                return setError("Ein Thema ist entweder zu lang (100 Zeichen / 10 Wörter) oder enthält ungültige Zeichen.")
              if (validTopics.length < 3)
                return setError("Bitte gib mindestens drei Themen an.")

              const data = new FormData()
              data.set("topics", validTopics.map(t => t.replaceAll(";", "<semicolon>")).join(";"))
              const res = await fetch(`/api/session/${sessionId}/player/${player.id}/submit`, {
                method: "POST",
                body: data
              })
              const resData: ApiResponse<{}> = await res.json()
              if (!resData.success) return setError(resData.error)
              setPlayer(resData.player)
              setSessionState(resData.session.state)
            }
          }}>
            <Form.Label>Deine Präsentations-Themen</Form.Label>
            {_.range(Math.max(3, topics.length)).map(i => (
              <Form.Control key={i} value={topics[i] ?? ""} onChange={e => setTopics(prev => [
                ...prev.slice(0, i),
                e.target.value,
                ...prev.slice(i + 1),
                ...(prev.every(t => t.length) && e.target.value.length ? [""] : [])
              ])} placeholder={`${i + 1}. Thema`}></Form.Control>
            ))}
            
            <Form.Group>
              <Button type="submit" disabled={topics.filter(isTopicValid).length < 3}>Abschicken</Button>
            </Form.Group>
          </Form>
          <div className="text-muted">
            <strong>Tipps</strong>
            <ul>
              <li>Überlege dir lustige, interessante, oder ganz alltägliche Themen.</li>
              <li>Gib mindestens drei Themen an, die nicht zu ähnlich sind.</li>
            </ul>
          </div>
        </>)}

        {player?.state == PlayerState.SUBMITTED && (<>
        
          {player.styleInstruction === null && (<>
            <h2>Gleich kann es losgehen, {player.firstName} :)</h2>
            <p><strong>Wichtig:</strong> Bitte lasse diese Seite geöffnet. Bevor dein Vortrag losgeht, erscheint hier evtl. noch ein kleiner Hinweis für dich.</p>
          </>)}
          {player.styleInstruction && (<>
            {player.styleInstruction == "-" && (<>
              <h2>Kein Hinweis :)</h2>
              <p>Viel Spaß bei den Vorträgen!</p>
            </>)}
            {player.styleInstruction != "-" && (<>
              <h2>Hinweis für deinen Vortrag</h2>
              <p className="large">{player.styleInstruction}</p>
            </>)}
          </>)}
        </>)}

      </Container>

    </main>
  </>);
}
