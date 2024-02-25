/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { ApiResponse, Player, PlayerState, SessionState } from '@/src/types';
import { useInitEffect } from '@/src/utils';
import 'bootstrap/dist/css/bootstrap.min.css';
import { setDefaultResultOrder } from 'dns';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from "react";
import { Alert, Button, Container, Form } from "react-bootstrap";
import _ from "lodash";

export default function Home({ params }: { params: { session: string } }) {

  const [error, setError] = useState<string>()

  const [session, setSession] = useState<string>()
  const [sessionState, setSessionState] = useState<SessionState | undefined>(undefined)
  const [player, setPlayer] = useState<Player>()

  // input states
  const [name, setName] = useState<string>()
  const [topics, setTopics] = useState<string[]>([])

  // get session id from URL params
  useEffect(() => {
    if (params.session) {
      setSession(params.session)
      setSessionState(SessionState.INIT)
    }
  }, [])

  // auto refresh
  useEffect(() => {
    const refresh = async () => {
      if (session) {
        const res = await fetch(`/api/session/${session}` + (player ? `/player/${player.id}` : "") + "/refresh")
        const resData: ApiResponse<{}> = await res.json()
        if (!resData.success) return setError(resData.error)
        if (resData.player) {
          setPlayer(resData.player)
        }
        setSessionState(resData.sessionState)
      }
    }
    const handle = setInterval(refresh, 2000)
    return () => clearInterval(handle)
  }, [session, player])

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

  return (<>
    <header className="py-3 bg-light">
      <Container style={{ maxWidth: "480px" }}>
        <h1>
          {logoState == "ppt" && <span style={{ color: "red", textAlign: "right" }}>ppt</span>}
          {logoState == "gpt" && <span style={{ color: "green", textAlign: "right" }}>gpt</span>}
          <span style={{ marginLeft: ".25rem", opacity: .5 }}>kara</span><span>ok</span>
        </h1>
      </Container>
    </header>
    <main className="py-3">
      <Container className="d-flex flex-column gap-3" style={{ maxWidth: "480px" }}>

        {!!error && (<Alert variant="danger">{error}</Alert>)}
        <p>
          Session: {session} -
          sessionState: {sessionState} -
          playerState: {player?.state ?? "undefined"} -
          topics: {JSON.stringify(topics)}
        </p>

        {(!player || player.state == PlayerState.JOINING) && (<>
          <Form onSubmit={async e => {
            e.preventDefault()
            if (session && name) {
              const data = new FormData()
              data.set("session", session)
              data.set("name", name)
              const res = await fetch(`/api/session/${session}/join`, {
                method: "POST",
                body: data
              })
              const resData: ApiResponse<{}> = await res.json()
              if (!resData.success) return setError(resData.error)
              setPlayer(resData.player)
              setSessionState(resData.sessionState)
            }
          }}>
            <Form.Group>
              <Form.Label>Dein Name</Form.Label>
              <Form.Control value={name ?? ""} onChange={e => setName(e.target.value)} disabled={!session}></Form.Control>
            </Form.Group>
            <Form.Group>
              <Button type="submit" disabled={!session}>Join</Button>
            </Form.Group>
          </Form>
        </>)}

        {(player?.state == PlayerState.JOINED) && (<>
          <Form className="d-flex flex-column gap-1" onSubmit={async e => {
            e.preventDefault()
            if (session && player && topics.length) {

              const nonEmptyTopics = topics.filter(t => t.length > 0)
              // t.match(/^[A-zÀ-ú]+$/)
              const validTopics = topics.filter(t => t.length > 0 && t.length <= 100 && t.split(" ").length <= 10)
              if (validTopics.length < nonEmptyTopics.length)
                return setError("Ein Thema ist entweder zu lang (100 Zeichen / 10 Wörter) oder enthält ungültige Zeichen.")
              if (validTopics.length < 3)
                return setError("Bitte gib mindestens drei Themen an.")

              const data = new FormData()
              data.set("topics", validTopics.join(","))
              const res = await fetch(`/api/session/${session}/player/${player.id}/submit`, {
                method: "POST",
                body: data
              })
              const resData: ApiResponse<{}> = await res.json()
              if (!resData.success) return setError(resData.error)
              setPlayer(resData.player)
              setSessionState(resData.sessionState)
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
              <Button type="submit" disabled={!session}>Abschicken</Button>
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


      </Container>

    </main>
  </>);
}
