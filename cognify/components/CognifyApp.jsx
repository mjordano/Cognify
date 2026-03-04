'use client'

import { useState, useEffect, useCallback } from 'react'
import OnboardScreen from './screens/OnboardScreen'
import MainScreen from './screens/MainScreen'
import LoadingScreen from './screens/LoadingScreen'
import QuizScreen from './screens/QuizScreen'
import ResultsScreen from './screens/ResultsScreen'
import SettingsModal from './ui/SettingsModal'

const HISTORY_KEY = 'cognify_history'
const API_KEY_KEY = 'cognify_api_key'
const MAX_HISTORY = 20

// ── Storage helpers ──────────────────────────────────────────────
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

// ── File type helpers ────────────────────────────────────────────
const FILE_TYPES = {
  pdf:  { exts: ['.pdf'],                          icon: '📄', label: 'PDF' },
  docx: { exts: ['.docx'],                         icon: '📝', label: 'Word' },
  img:  { exts: ['.jpg','.jpeg','.png','.webp','.gif'], icon: '🖼️', label: 'Image' },
  txt:  { exts: ['.txt', '.md'],                   icon: '📃', label: 'Text' },
}

function getFileKind(filename) {
  const lower = filename.toLowerCase()
  for (const [kind, cfg] of Object.entries(FILE_TYPES)) {
    if (cfg.exts.some(ext => lower.endsWith(ext))) return kind
  }
  return null
}

function getFileIcon(filename) {
  const kind = getFileKind(filename)
  return kind ? FILE_TYPES[kind].icon : '📎'
}

// ── PDF extraction via PDF.js ────────────────────────────────────
async function extractPDF(file) {
  const pdfjsLib = window['pdfjs-dist/build/pdf']
  if (!pdfjsLib) throw new Error('PDF.js not loaded yet. Please try again.')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map(item => item.str).join(' ') + '\n'
  }
  return text.trim()
}

// ── DOCX extraction via mammoth.js ──────────────────────────────
async function extractDOCX(file) {
  const mammoth = window.mammoth
  if (!mammoth) throw new Error('mammoth.js not loaded yet. Please try again.')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value.trim()
}

// ── Text / Markdown extraction ───────────────────────────────────
async function extractTxt(file) {
  return await file.text()
}

// ── Image → base64 ───────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Image description via OpenAI Vision ─────────────────────────
async function extractImage(file, apiKey) {
  const base64 = await fileToBase64(file)
  const mimeType = file.type || 'image/jpeg'

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: 'text',
              text: 'This image is study material. Please describe and extract all educational content from this image in detail — including any text, diagrams, charts, formulas, labels, concepts, and key information visible. Format your response as structured study notes that can be used to create flashcard questions.',
            },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error?.message || 'Vision API error: ' + res.status)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ════════════════════════════════════════════════════════════════
export default function CognifyApp() {
  // screen routing
  const [screen, setScreen] = useState('onboard')

  // onboarding
  const [obKey, setObKey]     = useState('')
  const [obError, setObError] = useState('')

  // settings modal
  const [settingsOpen, setSettingsOpen]   = useState(false)
  const [newKey, setNewKey]               = useState('')
  const [settingsError, setSettingsError] = useState('')

  // main / setup
  const [activeTab, setActiveTab]   = useState('new')
  const [cardCount, setCardCount]   = useState(10)
  const [setupError, setSetupError] = useState('')

  // uploaded files
  // each: { id, name, kind, file (File obj), status: 'pending'|'processing'|'done'|'error', content, error }
  const [uploadedFiles, setUploadedFiles] = useState([])

  // quiz state
  const [cards, setCards]       = useState([])
  const [idx, setIdx]           = useState(0)
  const [score, setScore]       = useState(0)
  const [wrong, setWrong]       = useState([])
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [studyTitle, setStudyTitle] = useState('')

  // history
  const [history, setHistory] = useState([])

  // ── boot ──────────────────────────────────────────────────────
  useEffect(() => {
    const key = localStorage.getItem(API_KEY_KEY)
    if (key) setScreen('main')
  }, [])

  const refreshHistory = useCallback(() => setHistory(getHistory()), [])

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
  const openSettings = () => { setNewKey(''); setSettingsError(''); setSettingsOpen(true) }
  const closeSettings = () => setSettingsOpen(false)

  const saveNewKey = () => {
    const k = newKey.trim()
    if (!k.startsWith('sk-')) { setSettingsError('Key must start with "sk-"'); return }
    localStorage.setItem(API_KEY_KEY, k)
    setSettingsOpen(false)
  }

  const deleteKey = () => {
    if (!confirm('Remove your saved API key?')) return
    localStorage.removeItem(API_KEY_KEY)
    setSettingsOpen(false)
    goTo('onboard')
  }

  const maskedKey = () => {
    const k = localStorage.getItem(API_KEY_KEY) || ''
    return k ? k.slice(0, 7) + '…' + k.slice(-4) : 'Not set'
  }

  // ── file management ───────────────────────────────────────────
  const addFiles = useCallback(async (fileList) => {
    const apiKey = localStorage.getItem(API_KEY_KEY) || ''
    const accepted = []

    for (const file of Array.from(fileList)) {
      const kind = getFileKind(file.name)
      if (!kind) continue // skip unsupported

      const entry = {
        id: Date.now() + Math.random(),
        name: file.name,
        kind,
        file,
        status: 'processing',
        content: '',
        error: '',
      }
      accepted.push(entry)
    }

    if (!accepted.length) return
    setUploadedFiles(prev => [...prev, ...accepted])

    // Process each file
    for (const entry of accepted) {
      try {
        let content = ''

        if (entry.kind === 'pdf') {
          content = await extractPDF(entry.file)
        } else if (entry.kind === 'docx') {
          content = await extractDOCX(entry.file)
        } else if (entry.kind === 'txt') {
          content = await extractTxt(entry.file)
        } else if (entry.kind === 'img') {
          content = await extractImage(entry.file, apiKey)
        }

        if (!content.trim()) throw new Error('No extractable content found.')

        setUploadedFiles(prev =>
          prev.map(f => f.id === entry.id
            ? { ...f, status: 'done', content }
            : f
          )
        )
      } catch (err) {
        setUploadedFiles(prev =>
          prev.map(f => f.id === entry.id
            ? { ...f, status: 'error', error: err.message }
            : f
          )
        )
      }
    }
  }, [])

  const removeFile = useCallback((id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const clearFiles = useCallback(() => setUploadedFiles([]), [])

  // ── generate ──────────────────────────────────────────────────
  const generate = async () => {
    const key = localStorage.getItem(API_KEY_KEY) || ''
    setSetupError('')

    const doneFiles = uploadedFiles.filter(f => f.status === 'done')
    if (!doneFiles.length) {
      setSetupError('Please upload at least one file and wait for it to finish processing.')
      return
    }
    if (uploadedFiles.some(f => f.status === 'processing')) {
      setSetupError('Please wait for all files to finish processing.')
      return
    }

    const combinedText = doneFiles
      .map(f => `=== ${f.name} ===\n${f.content}`)
      .join('\n\n')

    if (combinedText.length < 50) {
      setSetupError('Extracted content is too short. Please upload files with more content.')
      return
    }

    setStudyTitle(doneFiles.map(f => f.name).join(', ').slice(0, 50))
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
              content: `Create ${cardCount} flashcards from the following study material (may be from multiple files):\n\n${combinedText.slice(0, 8000)}`,
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
      try { parsed = JSON.parse(raw) }
      catch { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null }

      if (!parsed?.flashcards?.length) throw new Error('No flashcards found in AI response.')
      setCards(parsed.flashcards)
      startQuiz(parsed.flashcards)
    } catch (err) {
      goTo('main')
      let msg = err.message || 'Unknown error'
      if (/401|Incorrect API|invalid_api/i.test(msg)) msg = 'Invalid API key. Update it via ⚙ Settings.'
      else if (/429/.test(msg))                         msg = 'Rate limit reached. Wait a moment and retry.'
      else if (/fetch|network|failed/i.test(msg))       msg = 'Network error. Check your internet connection.'
      setSetupError(msg)
    }
  }

  // ── quiz ──────────────────────────────────────────────────────
  const startQuiz = (deck) => {
    setIdx(0); setScore(0); setWrong([])
    setAnswered(false); setSelected(new Set())
    if (deck) setCards(deck)
    goTo('quiz')
  }

  const retryQuiz = () => {
    setIdx(0); setScore(0); setWrong([])
    setAnswered(false); setSelected(new Set())
    goTo('quiz')
  }

  const pick = (id, type) => {
    if (answered) return
    setSelected(prev => {
      const next = new Set(prev)
      if (type === 'single') { next.clear(); next.add(id) }
      else { next.has(id) ? next.delete(id) : next.add(id) }
      return next
    })
  }

  const submitAnswer = () => {
    if (answered || selected.size === 0) return
    const card = cards[idx]
    const correctSet = new Set(card.answers.filter(a => a.is_correct).map(a => a.id))
    setAnswered(true)
    if (setsEqual(selected, correctSet)) setScore(s => s + 1)
    else setWrong(w => [...w, { card, selected: new Set(selected) }])
  }

  const nextCard = () => {
    const nextIdx = idx + 1
    if (nextIdx >= cards.length) {
      const pct = Math.round(((score + (
        (() => {
          const card = cards[idx]
          const correctSet = new Set(card.answers.filter(a => a.is_correct).map(a => a.id))
          return setsEqual(selected, correctSet) ? 1 : 0
        })()
      )) / cards.length) * 100)
      showResults()
    } else {
      setIdx(nextIdx)
      setAnswered(false)
      setSelected(new Set())
    }
  }

  const showResults = () => {
    const finalScore = score
    const pct = Math.round((finalScore / cards.length) * 100)
    saveHistory({
      id: Date.now(),
      date: new Date().toLocaleString(),
      title: studyTitle,
      questions: cards.length,
      score: pct,
      cards: JSON.parse(JSON.stringify(cards)),
    })
    goTo('results')
  }

  // ── history ───────────────────────────────────────────────────
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
  return (
    <>
      {screen !== 'onboard' && (
        <button className="gear-btn" onClick={openSettings} title="Settings">⚙</button>
      )}

      {screen === 'onboard' && (
        <OnboardScreen
          obKey={obKey} setObKey={setObKey}
          obError={obError} onSave={handleOnboardSave}
        />
      )}

      {screen === 'main' && (
        <MainScreen
          activeTab={activeTab} setActiveTab={setActiveTab}
          uploadedFiles={uploadedFiles}
          onAddFiles={addFiles}
          onRemoveFile={removeFile}
          onClearFiles={clearFiles}
          cardCount={cardCount} setCardCount={setCardCount}
          setupError={setupError} onGenerate={generate}
          history={history}
          onReplay={replaySession}
          onDelete={deleteSession}
          onExport={exportHistory}
        />
      )}

      {screen === 'load' && <LoadingScreen />}

      {screen === 'quiz' && (
        <QuizScreen
          cards={cards} idx={idx} score={score}
          answered={answered} selected={selected} wrong={wrong}
          onPick={pick} onSubmit={submitAnswer}
          onNext={nextCard} onQuit={() => goTo('main')}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          cards={cards} score={score} wrong={wrong}
          onRetry={retryQuiz} onNewDeck={() => goTo('main')}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          maskedKey={maskedKey()} newKey={newKey} setNewKey={setNewKey}
          settingsError={settingsError}
          onSave={saveNewKey} onDelete={deleteKey} onClose={closeSettings}
        />
      )}
    </>
  )
}
