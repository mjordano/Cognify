'use client'

import { useState, useEffect, useCallback } from 'react'
import OnboardScreen from './screens/OnboardScreen'
import MainScreen from './screens/MainScreen'
import LoadingScreen from './screens/LoadingScreen'
import QuizScreen from './screens/QuizScreen'
import ResultsScreen from './screens/ResultsScreen'
import SettingsModal from './ui/SettingsModal'

const HISTORY_KEY = 'cognify_history'
const API_KEY_KEY  = 'cognify_api_key'
const MAX_HISTORY  = 20

// ── helpers ─────────────────────────────────────────────────────
function getHistory() {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}

function saveHistory(entry) {
  const hist = getHistory()
  hist.unshift(entry)
  while (hist.length > MAX_HISTORY) hist.pop()
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist))
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false
  for (const v of a) if (!b.has(v)) return false
  return true
}

// ── component ────────────────────────────────────────────────────
export default function CognifyApp() {
  // screen routing
  const [screen, setScreen] = useState('onboard') // onboard | main | load | quiz | results

  // onboarding
  const [obKey, setObKey]     = useState('')
  const [obError, setObError] = useState('')

  // settings modal
  const [settingsOpen, setSettingsOpen]   = useState(false)
  const [newKey, setNewKey]               = useState('')
  const [settingsError, setSettingsError] = useState('')

  // main / setup
  const [activeTab, setActiveTab]   = useState('new')
  const [studyText, setStudyText]   = useState('')
  const [cardCount, setCardCount]   = useState(10)
  const [setupError, setSetupError] = useState('')

  // quiz state
  const [cards, setCards]       = useState([])
  const [idx, setIdx]           = useState(0)
  const [score, setScore]       = useState(0)
  const [wrong, setWrong]       = useState([])
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [studyTitle, setStudyTitle] = useState('')

  // history (loaded from localStorage, refreshed when entering main)
  const [history, setHistory] = useState([])

  // ── boot ──────────────────────────────────────────────────────
  useEffect(() => {
    const key = localStorage.getItem(API_KEY_KEY)
    if (key) setScreen('main')
  }, [])

  const refreshHistory = useCallback(() => {
    setHistory(getHistory())
  }, [])

  useEffect(() => {
    if (screen === 'main') refreshHistory()
  }, [screen, refreshHistory])

  // ── navigation ────────────────────────────────────────────────
  const goTo = (name) => {
    setScreen(name)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── onboarding ────────────────────────────────────────────────
  const handleOnboardSave = () => {
    const k = obKey.trim()
    if (!k.startsWith('sk-')) { setObError('Key must start with "sk-"'); return }
    localStorage.setItem(API_KEY_KEY, k)
    setObError('')
    goTo('main')
  }

  // ── settings ──────────────────────────────────────────────────
  const openSettings = () => {
    setNewKey('')
    setSettingsError('')
    setSettingsOpen(true)
  }

  const saveNewKey = () => {
    const k = newKey.trim()
    if (!k.startsWith('sk-')) { setSettingsError('Key must start with "sk-"'); return }
    localStorage.setItem(API_KEY_KEY, k)
    setSettingsOpen(false)
  }

  const deleteKey = () => {
    if (!confirm('Remove your saved API key? You will need to enter it again.')) return
    localStorage.removeItem(API_KEY_KEY)
    setSettingsOpen(false)
    goTo('onboard')
  }

  const maskedKey = () => {
    const k = localStorage.getItem(API_KEY_KEY) || ''
    return k ? k.slice(0, 7) + '…' + k.slice(-4) : 'Not set'
  }

  // ── generate ──────────────────────────────────────────────────
  const generate = async () => {
    const key = localStorage.getItem(API_KEY_KEY) || ''
    const text = studyText.trim()
    setSetupError('')
    if (text.length < 50) { setSetupError('Please enter at least 50 characters of study material.'); return }
    setStudyTitle(text.slice(0, 50))
    goTo('load')

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 4000,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are an expert educator. Return ONLY valid JSON, no markdown, no code fences.
Schema: {"flashcards":[{"id":"q1","question":"...","type":"single","answers":[{"id":"a","text":"...","is_correct":true}],"explanation":"..."}]}
Generate exactly ${cardCount} flashcards. ~60% type "single" (exactly 1 correct answer), ~40% type "multi" (2-3 correct answers). Each question has 3-5 options. Make distractors plausible. Keep explanations to 1-2 sentences.`,
            },
            {
              role: 'user',
              content: `Create ${cardCount} flashcards from this material:\n\n${text.slice(0, 6000)}`,
            },
          ],
        }),
      })

      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error?.message || 'HTTP ' + res.status)
      }

      const data = await res.json()
      let raw = (data.choices?.[0]?.message?.content || '')
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

      let parsed
      try {
        parsed = JSON.parse(raw)
      } catch {
        const m = raw.match(/\{[\s\S]*\}/)
        parsed = m ? JSON.parse(m[0]) : null
      }

      if (!parsed?.flashcards?.length) throw new Error('No flashcards found in AI response.')
      setCards(parsed.flashcards)
      startQuiz(parsed.flashcards)
    } catch (err) {
      goTo('main')
      let msg = err.message || 'Unknown error'
      if (/401|Incorrect API|invalid_api/i.test(msg)) msg = 'Invalid API key. Update it via the ⚙ button.'
      else if (/429/.test(msg))                         msg = 'Rate limit reached. Wait a moment and retry.'
      else if (/fetch|network|failed/i.test(msg))       msg = 'Network error. Check your internet connection.'
      setSetupError(msg)
    }
  }

  // ── quiz ──────────────────────────────────────────────────────
  const startQuiz = (deck) => {
    setIdx(0)
    setScore(0)
    setWrong([])
    setAnswered(false)
    setSelected(new Set())
    if (deck) setCards(deck)
    goTo('quiz')
  }

  const retryQuiz = () => {
    setIdx(0)
    setScore(0)
    setWrong([])
    setAnswered(false)
    setSelected(new Set())
    goTo('quiz')
  }

  const pick = (id, type) => {
    if (answered) return
    setSelected(prev => {
      const next = new Set(prev)
      if (type === 'single') {
        next.clear()
        next.add(id)
      } else {
        if (next.has(id)) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  const submitAnswer = () => {
    if (answered || selected.size === 0) return
    const card = cards[idx]
    const correctSet = new Set(card.answers.filter(a => a.is_correct).map(a => a.id))
    const isOk = setsEqual(selected, correctSet)
    setAnswered(true)
    if (isOk) setScore(s => s + 1)
    else setWrong(w => [...w, { card, selected: new Set(selected) }])
  }

  const nextCard = () => {
    const nextIdx = idx + 1
    if (nextIdx >= cards.length) {
      showResults()
    } else {
      setIdx(nextIdx)
      setAnswered(false)
      setSelected(new Set())
    }
  }

  const showResults = () => {
    const pct = Math.round((score / cards.length) * 100)
    // Save session to history
    saveHistory({
      id:        Date.now(),
      date:      new Date().toLocaleString(),
      title:     studyTitle,
      questions: cards.length,
      score:     pct,
      cards:     JSON.parse(JSON.stringify(cards)),
    })
    goTo('results')
  }

  // ── history actions ───────────────────────────────────────────
  const replaySession = (session) => {
    setCards(session.cards)
    setStudyTitle(session.title)
    startQuiz(session.cards)
  }

  const deleteSession = (id) => {
    if (!confirm('Delete this session from history?')) return
    const updated = getHistory().filter(h => h.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    setHistory(updated)
  }

  const exportHistory = () => {
    const hist = getHistory()
    if (!hist.length) { alert('No history to export.'); return }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(hist, null, 2)], { type: 'application/json' }))
    a.download = 'cognify-history-' + Date.now() + '.json'
    a.click()
  }

  // ── render ────────────────────────────────────────────────────
  const showGear = screen !== 'onboard'

  return (
    <>
      {/* Gear / settings button */}
      {showGear && (
        <button className="gear-btn" onClick={openSettings} title="Settings">⚙</button>
      )}

      {/* Screens */}
      {screen === 'onboard' && (
        <OnboardScreen
          obKey={obKey}
          setObKey={setObKey}
          obError={obError}
          onSave={handleOnboardSave}
        />
      )}

      {screen === 'main' && (
        <MainScreen
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          studyText={studyText}
          setStudyText={setStudyText}
          cardCount={cardCount}
          setCardCount={setCardCount}
          setupError={setupError}
          onGenerate={generate}
          history={history}
          onReplay={replaySession}
          onDelete={deleteSession}
          onExport={exportHistory}
        />
      )}

      {screen === 'load' && <LoadingScreen />}

      {screen === 'quiz' && (
        <QuizScreen
          cards={cards}
          idx={idx}
          score={score}
          answered={answered}
          selected={selected}
          wrong={wrong}
          onPick={pick}
          onSubmit={submitAnswer}
          onNext={nextCard}
          onQuit={() => goTo('main')}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          cards={cards}
          score={score}
          wrong={wrong}
          onRetry={retryQuiz}
          onNewDeck={() => goTo('main')}
        />
      )}

      {/* Settings modal */}
      {settingsOpen && (
        <SettingsModal
          maskedKey={maskedKey()}
          newKey={newKey}
          setNewKey={setNewKey}
          settingsError={settingsError}
          onSave={saveNewKey}
          onDelete={deleteKey}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  )
}
