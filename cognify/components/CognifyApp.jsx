'use client'

import { useState, useEffect, useCallback } from 'react'
import OnboardScreen from './screens/OnboardScreen'
import MainScreen from './screens/MainScreen'
import LoadingScreen from './screens/LoadingScreen'
import QuizScreen from './screens/QuizScreen'
import ResultsScreen from './screens/ResultsScreen'
import SettingsModal from './ui/SettingsModal'

const HISTORY_KEY  = 'cognify_history'
const API_KEY_KEY  = 'cognify_api_key'
const MAX_HISTORY  = 20
const MAX_OCR_PAGES = 10
const PDF_WORKER_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

// ── Storage helpers ───────────────────────────────────────────────
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

// ── File type registry ────────────────────────────────────────────
const FILE_TYPES = {
  pdf:  { exts: ['.pdf'],                               icon: '📄', label: 'PDF' },
  docx: { exts: ['.docx'],                              icon: '📝', label: 'Word' },
  img:  { exts: ['.jpg','.jpeg','.png','.webp','.gif'], icon: '🖼️', label: 'Image' },
  txt:  { exts: ['.txt', '.md'],                        icon: '📃', label: 'Text' },
}
function getFileKind(filename) {
  const lower = filename.toLowerCase()
  for (const [kind, cfg] of Object.entries(FILE_TYPES))
    if (cfg.exts.some(ext => lower.endsWith(ext))) return kind
  return null
}

// ── PDF.js: get lib with worker configured ────────────────────────
function getPdfLib() {
  const lib = window['pdfjs-dist/build/pdf']
  if (!lib) throw new Error('PDF.js is still loading — please try again in a moment.')
  // Always (re)set the workerSrc — safe to call multiple times
  if (!lib.GlobalWorkerOptions.workerSrc) {
    lib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL
  }
  return lib
}

// ── Render a single PDF page to a canvas and return base64 PNG ────
async function pdfPageToBase64(page) {
  const viewport = page.getViewport({ scale: 1.5 })
  const canvas   = document.createElement('canvas')
  canvas.width   = viewport.width
  canvas.height  = viewport.height
  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport }).promise
  // Return base64 without the data URI prefix
  return canvas.toDataURL('image/png').split(',')[1]
}

// ── Ask OpenAI Vision to OCR a single base64 PNG ─────────────────
async function ocrPageWithVision(base64, pageNum, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${base64}` },
          },
          {
            type: 'text',
            text: `This is page ${pageNum} of a PDF document that is study material (may be scanned, handwritten, or a slide). Please transcribe and extract ALL content visible — text, formulas, labels, table data, diagrams descriptions, headings, bullet points. Output as structured study notes. Be thorough.`,
          },
        ],
      }],
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error?.message || `Vision API HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

// ── Main PDF extraction with fallback to vision OCR ───────────────
// onStatus(msg) — callback so the UI can show live progress messages
async function extractPDF(file, apiKey, onStatus) {
  const pdfjsLib = getPdfLib()

  onStatus('Loading PDF…')
  const arrayBuffer = await file.arrayBuffer()

  // Use a copy of the buffer because pdf.getDocument() may detach it
  const pdfData = new Uint8Array(arrayBuffer)

  let pdf
  try {
    pdf = await pdfjsLib.getDocument({ data: pdfData }).promise
  } catch (err) {
    throw new Error(`Failed to open PDF: ${err.message}`)
  }

  const totalPages = pdf.numPages
  onStatus(`Extracting text from ${totalPages} page${totalPages !== 1 ? 's' : ''}…`)

  // ── Step 1: Try native text extraction ───────────────────────
  let extractedText = ''
  for (let i = 1; i <= totalPages; i++) {
    const page    = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (pageText) extractedText += pageText + '\n\n'
  }

  const cleanText = extractedText.trim()

  // ── Step 2: If enough text found, return it ───────────────────
  if (cleanText.length >= 50) {
    onStatus(`Text extracted (${cleanText.length.toLocaleString()} chars)`)
    return cleanText
  }

  // ── Step 3: No selectable text → Vision OCR fallback ─────────
  const pagesToOCR = Math.min(totalPages, MAX_OCR_PAGES)
  const skipped    = totalPages > MAX_OCR_PAGES

  if (skipped) {
    onStatus(`No text layer found. Running AI Vision OCR on first ${MAX_OCR_PAGES} of ${totalPages} pages…`)
  } else {
    onStatus(`No text layer found. Running AI Vision OCR on ${pagesToOCR} page${pagesToOCR !== 1 ? 's' : ''}…`)
  }

  const ocrParts = []
  for (let i = 1; i <= pagesToOCR; i++) {
    onStatus(`AI Vision OCR — page ${i} / ${pagesToOCR}…`)
    const page   = await pdf.getPage(i)
    const base64 = await pdfPageToBase64(page)
    const text   = await ocrPageWithVision(base64, i, apiKey)
    if (text) ocrParts.push(`--- Page ${i} ---\n${text}`)
  }

  if (!ocrParts.length) {
    throw new Error('Could not extract any content from this PDF (tried text + vision OCR).')
  }

  const ocrText = ocrParts.join('\n\n')
  const warningNote = skipped
    ? `\n\n[Note: PDF has ${totalPages} pages; only first ${MAX_OCR_PAGES} were processed via OCR.]`
    : ''

  onStatus(`OCR complete — ${ocrText.length.toLocaleString()} chars from ${pagesToOCR} page${pagesToOCR !== 1 ? 's' : ''}${skipped ? ` (${totalPages - MAX_OCR_PAGES} pages skipped)` : ''}`)
  return ocrText + warningNote
}

// ── DOCX extraction via mammoth.js ────────────────────────────────
async function extractDOCX(file) {
  const mammoth = window.mammoth
  if (!mammoth) throw new Error('mammoth.js is still loading — please try again in a moment.')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = result.value?.trim()
  if (!text) throw new Error('No text content found in this Word document.')
  return text
}

// ── Plain text / Markdown ─────────────────────────────────────────
async function extractTxt(file) {
  const text = await file.text()
  if (!text.trim()) throw new Error('File appears to be empty.')
  return text
}

// ── Image description via OpenAI Vision ──────────────────────────
async function extractImage(file, apiKey) {
  const reader = new FileReader()
  const base64 = await new Promise((res, rej) => {
    reader.onload  = () => res(reader.result.split(',')[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${file.type || 'image/jpeg'};base64,${base64}` } },
          { type: 'text', text: 'This image is study material. Extract all educational content — text, diagrams, charts, formulas, labels, concepts — as structured study notes suitable for making flashcard questions.' },
        ],
      }],
    }),
  })

  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error?.message || `Vision API error: ${res.status}`)
  }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('No content returned from Vision API.')
  return text
}

// ═══════════════════════════════════════════════════════════════════
export default function CognifyApp() {
  const [screen, setScreen]           = useState('onboard')
  const [obKey, setObKey]             = useState('')
  const [obError, setObError]         = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newKey, setNewKey]           = useState('')
  const [settingsError, setSettingsError] = useState('')
  const [activeTab, setActiveTab]     = useState('new')
  const [cardCount, setCardCount]     = useState(10)
  const [setupError, setSetupError]   = useState('')

  // Each file: { id, name, kind, file, status:'processing'|'done'|'error', statusMsg, content, error }
  const [uploadedFiles, setUploadedFiles] = useState([])

  const [cards, setCards]         = useState([])
  const [idx, setIdx]             = useState(0)
  const [score, setScore]         = useState(0)
  const [wrong, setWrong]         = useState([])
  const [answered, setAnswered]   = useState(false)
  const [selected, setSelected]   = useState(new Set())
  const [studyTitle, setStudyTitle] = useState('')
  const [history, setHistory]     = useState([])

  // ── Boot ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (localStorage.getItem(API_KEY_KEY)) setScreen('main')
  }, [])

  const refreshHistory = useCallback(() => setHistory(getHistory()), [])
  useEffect(() => { if (screen === 'main') refreshHistory() }, [screen, refreshHistory])

  const goTo = (name) => { setScreen(name); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // ── Onboarding ───────────────────────────────────────────────────
  const handleOnboardSave = () => {
    const k = obKey.trim()
    if (!k.startsWith('sk-')) { setObError('Key must start with "sk-"'); return }
    localStorage.setItem(API_KEY_KEY, k)
    setObError('')
    goTo('main')
  }

  // ── Settings ─────────────────────────────────────────────────────
  const openSettings  = () => { setNewKey(''); setSettingsError(''); setSettingsOpen(true) }
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

  // ── File status helpers ──────────────────────────────────────────
  const setFileStatus = (id, patch) =>
    setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))

  // ── Add & process files ───────────────────────────────────────────
  const addFiles = useCallback(async (fileList) => {
    const apiKey   = localStorage.getItem(API_KEY_KEY) || ''
    const accepted = []

    for (const file of Array.from(fileList)) {
      const kind = getFileKind(file.name)
      if (!kind) continue
      accepted.push({
        id: Date.now() + Math.random(),
        name: file.name,
        kind,
        file,
        status: 'processing',
        statusMsg: 'Waiting…',
        content: '',
        error: '',
      })
    }

    if (!accepted.length) return
    setUploadedFiles(prev => [...prev, ...accepted])

    // Process files sequentially to avoid overwhelming the browser / API
    for (const entry of accepted) {
      const update = (statusMsg) => setFileStatus(entry.id, { statusMsg })

      try {
        let content = ''

        if (entry.kind === 'pdf') {
          content = await extractPDF(entry.file, apiKey, update)
        } else if (entry.kind === 'docx') {
          update('Extracting Word document…')
          content = await extractDOCX(entry.file)
        } else if (entry.kind === 'txt') {
          update('Reading text file…')
          content = await extractTxt(entry.file)
        } else if (entry.kind === 'img') {
          update('Sending to AI Vision…')
          content = await extractImage(entry.file, apiKey)
        }

        setFileStatus(entry.id, {
          status: 'done',
          statusMsg: `✓ ${content.length.toLocaleString()} chars`,
          content,
        })
      } catch (err) {
        setFileStatus(entry.id, {
          status: 'error',
          statusMsg: '',
          error: err.message,
        })
      }
    }
  }, [])

  const removeFile = useCallback((id) =>
    setUploadedFiles(prev => prev.filter(f => f.id !== id)), [])

  const clearFiles = useCallback(() => setUploadedFiles([]), [])

  // ── Generate flashcards ──────────────────────────────────────────
  const generate = async () => {
    const key = localStorage.getItem(API_KEY_KEY) || ''
    setSetupError('')

    if (uploadedFiles.some(f => f.status === 'processing')) {
      setSetupError('Please wait for all files to finish processing.')
      return
    }
    const doneFiles = uploadedFiles.filter(f => f.status === 'done')
    if (!doneFiles.length) {
      setSetupError('Upload at least one file and wait for processing to complete.')
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
Generate exactly ${cardCount} flashcards. ~60% type "single" (exactly 1 correct), ~40% type "multi" (2-3 correct). Each question has 3-5 options. Make distractors plausible. Explanations: 1-2 sentences.`,
            },
            {
              role: 'user',
              content: `Create ${cardCount} flashcards from this study material (combined from ${doneFiles.length} file${doneFiles.length !== 1 ? 's' : ''}):\n\n${combinedText.slice(0, 8000)}`,
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
        .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

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

  // ── Quiz ─────────────────────────────────────────────────────────
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
    const card       = cards[idx]
    const correctSet = new Set(card.answers.filter(a => a.is_correct).map(a => a.id))
    setAnswered(true)
    if (setsEqual(selected, correctSet)) setScore(s => s + 1)
    else setWrong(w => [...w, { card, selected: new Set(selected) }])
  }

  const nextCard = () => {
    const nextIdx = idx + 1
    if (nextIdx >= cards.length) showResults()
    else { setIdx(nextIdx); setAnswered(false); setSelected(new Set()) }
  }

  const showResults = () => {
    const pct = Math.round((score / cards.length) * 100)
    saveHistory({
      id: Date.now(), date: new Date().toLocaleString(),
      title: studyTitle, questions: cards.length, score: pct,
      cards: JSON.parse(JSON.stringify(cards)),
    })
    goTo('results')
  }

  // ── History ───────────────────────────────────────────────────────
  const replaySession = (session) => {
    setCards(session.cards); setStudyTitle(session.title); startQuiz(session.cards)
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

  // ── Render ────────────────────────────────────────────────────────
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
          onAddFiles={addFiles} onRemoveFile={removeFile} onClearFiles={clearFiles}
          cardCount={cardCount} setCardCount={setCardCount}
          setupError={setupError} onGenerate={generate}
          history={history}
          onReplay={replaySession} onDelete={deleteSession} onExport={exportHistory}
        />
      )}

      {screen === 'load'    && <LoadingScreen />}

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
