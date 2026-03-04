'use client'

import { useState, useEffect, useCallback } from 'react'
import OnboardScreen from './screens/OnboardScreen'
import MainScreen from './screens/MainScreen'
import LoadingScreen from './screens/LoadingScreen'
import QuizScreen from './screens/QuizScreen'
import ResultsScreen from './screens/ResultsScreen'
import SettingsModal from './ui/SettingsModal'

const HISTORY_KEY    = 'cognify_history'
const API_KEY_KEY    = 'cognify_api_key'
const MAX_HISTORY    = 20
const MAX_OCR_PAGES  = 10
const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

// OpenRouter config — OpenAI-compatible endpoint
const OR_BASE       = 'https://openrouter.ai/api/v1'
// Primary model: Gemini 2.0 Flash (free on OpenRouter)
const OR_MODEL_TEXT = 'openrouter/free'
// Vision model: supports image inputs
const OR_MODEL_VIS  = 'openrouter/free'

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

// ── JSON repair: close a truncated flashcards array/object ────────
function repairJSON(raw) {
  // Strip markdown fences
  let s = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  // Try direct parse first
  try { return JSON.parse(s) } catch {}

  // Find last complete flashcard object by scanning for complete "}]}" or "}]" patterns
  // Strategy: keep trimming from the end until we can close the structure
  const base = s.indexOf('{"flashcards"')
  if (base === -1) return null
  s = s.slice(base)

  // Try closing the array+object at progressively earlier positions
  for (let i = s.length; i > 10; i--) {
    const chunk = s.slice(0, i).trimEnd()
    // Try various closings
    const attempts = [
      chunk,
      chunk + ']}',
      chunk + '"]}',
      chunk + '"}]}',
      chunk + '"]}',
      chunk.replace(/,\s*$/, '') + ']}',
      chunk.replace(/,\s*$/, '') + '"]}',
      chunk.replace(/,\s*$/, '') + '"}]}',
    ]
    for (const attempt of attempts) {
      try {
        const obj = JSON.parse(attempt)
        if (obj?.flashcards?.length) return obj
      } catch {}
    }
  }
  return null
}

// ── OpenRouter: text completion with JSON response ─────────────────
async function orText(systemPrompt, userPrompt, apiKey, maxTokens = 8192) {
  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://cognify.app',
      'X-Title': 'Cognify Flashcards',
    },
    body: JSON.stringify({
      model: OR_MODEL_TEXT,
      max_tokens: maxTokens,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    }),
  })

  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error?.message || `HTTP ${res.status}`)
  }

  const data = await res.json()

  // OpenRouter wraps errors inside a successful 200 sometimes
  if (data.error) throw new Error(data.error.message || 'OpenRouter error')

  return data.choices?.[0]?.message?.content || ''
}

// ── OpenRouter: vision completion (plain text response) ────────────
async function orVision(base64, mimeType, textPrompt, apiKey) {
  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://cognify.app',
      'X-Title': 'Cognify Flashcards',
    },
    body: JSON.stringify({
      model: OR_MODEL_VIS,
      max_tokens: 2048,
      temperature: 0.2,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: 'text', text: textPrompt },
        ],
      }],
    }),
  })

  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error?.message || `Vision HTTP ${res.status}`)
  }

  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'Vision API error')
  return data.choices?.[0]?.message?.content?.trim() || ''
}

// ── PDF.js helpers ────────────────────────────────────────────────
function getPdfLib() {
  const lib = window['pdfjs-dist/build/pdf']
  if (!lib) throw new Error('PDF.js is still loading — please try again in a moment.')
  if (!lib.GlobalWorkerOptions.workerSrc)
    lib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL
  return lib
}

async function pdfPageToBase64(page) {
  const viewport = page.getViewport({ scale: 1.5 })
  const canvas   = document.createElement('canvas')
  canvas.width   = viewport.width
  canvas.height  = viewport.height
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
  return canvas.toDataURL('image/png').split(',')[1]
}

// ── PDF extraction with vision OCR fallback ───────────────────────
async function extractPDF(file, apiKey, onStatus) {
  const pdfjsLib = getPdfLib()
  onStatus('Loading PDF…')

  const pdfData = new Uint8Array(await file.arrayBuffer())
  let pdf
  try { pdf = await pdfjsLib.getDocument({ data: pdfData }).promise }
  catch (err) { throw new Error(`Failed to open PDF: ${err.message}`) }

  const totalPages = pdf.numPages
  onStatus(`Extracting text from ${totalPages} page${totalPages !== 1 ? 's' : ''}…`)

  let extractedText = ''
  for (let i = 1; i <= totalPages; i++) {
    const page    = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ').replace(/\s+/g, ' ').trim()
    if (pageText) extractedText += pageText + '\n\n'
  }

  if (extractedText.trim().length >= 50) {
    onStatus(`Text extracted (${extractedText.trim().length.toLocaleString()} chars)`)
    return extractedText.trim()
  }

  // Fallback: vision OCR
  const pagesToOCR = Math.min(totalPages, MAX_OCR_PAGES)
  const skipped    = totalPages > MAX_OCR_PAGES
  onStatus(`No text layer — AI Vision OCR on ${pagesToOCR}${skipped ? ` of ${totalPages}` : ''} page${pagesToOCR !== 1 ? 's' : ''}…`)

  const ocrParts = []
  for (let i = 1; i <= pagesToOCR; i++) {
    onStatus(`AI Vision OCR — page ${i} / ${pagesToOCR}…`)
    const page   = await pdf.getPage(i)
    const base64 = await pdfPageToBase64(page)
    const text   = await orVision(
      base64, 'image/png',
      `Page ${i} of a PDF (may be scanned/handwritten). Transcribe ALL content — text, formulas, tables, labels, headings. Output as structured study notes.`,
      apiKey
    )
    if (text) ocrParts.push(`--- Page ${i} ---\n${text}`)
  }

  if (!ocrParts.length)
    throw new Error('Could not extract content from this PDF (tried text + vision OCR).')

  const result = ocrParts.join('\n\n')
  onStatus(`OCR complete — ${result.length.toLocaleString()} chars${skipped ? ` (${totalPages - MAX_OCR_PAGES} pages skipped)` : ''}`)
  return result + (skipped ? `\n\n[Note: PDF has ${totalPages} pages; only first ${MAX_OCR_PAGES} processed.]` : '')
}

// ── DOCX via mammoth.js ───────────────────────────────────────────
async function extractDOCX(file) {
  const mammoth = window.mammoth
  if (!mammoth) throw new Error('mammoth.js is still loading — please try again.')
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
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

// ── Image via OpenRouter Vision ───────────────────────────────────
async function extractImage(file, apiKey) {
  const base64 = await new Promise((res, rej) => {
    const r = new FileReader()
    r.onload  = () => res(r.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
  const text = await orVision(
    base64, file.type || 'image/jpeg',
    'This image is study material. Extract all educational content — text, diagrams, charts, formulas, labels — as structured study notes for flashcard questions.',
    apiKey
  )
  if (!text) throw new Error('No content returned from Vision API.')
  return text
}

// ═══════════════════════════════════════════════════════════════════
export default function CognifyApp() {
  const [screen, setScreen]               = useState('onboard')
  const [obKey, setObKey]                 = useState('')
  const [obError, setObError]             = useState('')
  const [settingsOpen, setSettingsOpen]   = useState(false)
  const [newKey, setNewKey]               = useState('')
  const [settingsError, setSettingsError] = useState('')
  const [activeTab, setActiveTab]         = useState('new')
  const [cardCount, setCardCount]         = useState(10)
  const [setupError, setSetupError]       = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [cards, setCards]                 = useState([])
  const [idx, setIdx]                     = useState(0)
  const [score, setScore]                 = useState(0)
  const [wrong, setWrong]                 = useState([])
  const [answered, setAnswered]           = useState(false)
  const [selected, setSelected]           = useState(new Set())
  const [studyTitle, setStudyTitle]       = useState('')
  const [history, setHistory]             = useState([])

  useEffect(() => { if (localStorage.getItem(API_KEY_KEY)) setScreen('main') }, [])
  const refreshHistory = useCallback(() => setHistory(getHistory()), [])
  useEffect(() => { if (screen === 'main') refreshHistory() }, [screen, refreshHistory])

  const goTo = (name) => { setScreen(name); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // ── Onboarding ────────────────────────────────────────────────────
  const handleOnboardSave = () => {
    const k = obKey.trim()
    if (k.length < 20) { setObError('Please enter a valid OpenRouter API key.'); return }
    localStorage.setItem(API_KEY_KEY, k)
    setObError('')
    goTo('main')
  }

  // ── Settings ──────────────────────────────────────────────────────
  const openSettings  = () => { setNewKey(''); setSettingsError(''); setSettingsOpen(true) }
  const closeSettings = () => setSettingsOpen(false)
  const saveNewKey = () => {
    const k = newKey.trim()
    if (k.length < 20) { setSettingsError('Please enter a valid OpenRouter API key.'); return }
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
    return k ? k.slice(0, 8) + '…' + k.slice(-4) : 'Not set'
  }

  // ── File processing ───────────────────────────────────────────────
  const setFileStatus = (id, patch) =>
    setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))

  const addFiles = useCallback(async (fileList) => {
    const apiKey   = localStorage.getItem(API_KEY_KEY) || ''
    const accepted = []
    for (const file of Array.from(fileList)) {
      const kind = getFileKind(file.name)
      if (!kind) continue
      accepted.push({ id: Date.now() + Math.random(), name: file.name, kind, file, status: 'processing', statusMsg: 'Waiting…', content: '', error: '' })
    }
    if (!accepted.length) return
    setUploadedFiles(prev => [...prev, ...accepted])

    for (const entry of accepted) {
      const update = (statusMsg) => setFileStatus(entry.id, { statusMsg })
      try {
        let content = ''
        if      (entry.kind === 'pdf')  content = await extractPDF(entry.file, apiKey, update)
        else if (entry.kind === 'docx') { update('Extracting Word document…'); content = await extractDOCX(entry.file) }
        else if (entry.kind === 'txt')  { update('Reading file…');              content = await extractTxt(entry.file) }
        else if (entry.kind === 'img')  { update('Sending to AI Vision…');      content = await extractImage(entry.file, apiKey) }
        setFileStatus(entry.id, { status: 'done', statusMsg: `✓ ${content.length.toLocaleString()} chars`, content })
      } catch (err) {
        setFileStatus(entry.id, { status: 'error', statusMsg: '', error: err.message })
      }
    }
  }, [])

  const removeFile = useCallback((id) => setUploadedFiles(prev => prev.filter(f => f.id !== id)), [])
  const clearFiles = useCallback(() => setUploadedFiles([]), [])

  // ── Generate flashcards ───────────────────────────────────────────
  const generate = async () => {
    const key = localStorage.getItem(API_KEY_KEY) || ''
    setSetupError('')
    if (uploadedFiles.some(f => f.status === 'processing')) { setSetupError('Please wait for all files to finish processing.'); return }
    const doneFiles = uploadedFiles.filter(f => f.status === 'done')
    if (!doneFiles.length) { setSetupError('Upload at least one file and wait for processing to complete.'); return }

    const combinedText = doneFiles.map(f => `=== ${f.name} ===\n${f.content}`).join('\n\n')
    if (combinedText.length < 50) { setSetupError('Extracted content is too short.'); return }

    setStudyTitle(doneFiles.map(f => f.name).join(', ').slice(0, 50))
    goTo('load')

    try {
      const systemPrompt = `You are an expert educator. Return ONLY valid JSON matching this exact schema — no markdown, no code fences:
{"flashcards":[{"id":"q1","question":"...","type":"single","answers":[{"id":"a","text":"...","is_correct":true}],"explanation":"..."}]}
Generate exactly ${cardCount} flashcards. ~60% type "single" (exactly 1 correct), ~40% type "multi" (2-3 correct). Each has 3-5 answer options. Distractors must be plausible. Explanations: 1-2 sentences.
CRITICAL: Detect the language of the study material and write ALL content (questions, answers, explanations) in that same language. Do not translate into English.`

      // ~400 tokens per flashcard + 500 buffer; cap at 16000 to stay within model limits
      const maxTokens = Math.min(cardCount * 400 + 500, 16000)

      // Trim input: leave room for the response (rough estimate: 4 chars per token)
      const inputBudget = Math.max(2000, 32000 - maxTokens) * 4
      const userPrompt = `Create ${cardCount} flashcards from this study material (${doneFiles.length} file${doneFiles.length !== 1 ? 's' : ''}):\n\n${combinedText.slice(0, inputBudget)}`

      const raw = await orText(systemPrompt, userPrompt, key, maxTokens)
      const parsed = repairJSON(raw)

      if (!parsed?.flashcards?.length) throw new Error('No flashcards found in AI response.')
      setCards(parsed.flashcards)
      startQuiz(parsed.flashcards)
    } catch (err) {
      goTo('main')
      let msg = err.message || 'Unknown error'
      if (/invalid.*key|unauthorized|401/i.test(msg))    msg = 'Invalid API key. Update it via ⚙ Settings.'
      else if (/quota|429|rate.?limit|exceeded/i.test(msg)) msg = 'Rate limit reached. Wait a moment and retry, or try a different free model.'
      else if (/fetch|network|failed/i.test(msg))          msg = 'Network error. Check your connection.'
      setSetupError(msg)
    }
  }

  // ── Quiz ──────────────────────────────────────────────────────────
  const startQuiz = (deck) => { setIdx(0); setScore(0); setWrong([]); setAnswered(false); setSelected(new Set()); if (deck) setCards(deck); goTo('quiz') }
  const retryQuiz = () => { setIdx(0); setScore(0); setWrong([]); setAnswered(false); setSelected(new Set()); goTo('quiz') }
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
    const correctSet = new Set(cards[idx].answers.filter(a => a.is_correct).map(a => a.id))
    setAnswered(true)
    if (setsEqual(selected, correctSet)) setScore(s => s + 1)
    else setWrong(w => [...w, { card: cards[idx], selected: new Set(selected) }])
  }
  const nextCard = () => {
    const n = idx + 1
    if (n >= cards.length) showResults()
    else { setIdx(n); setAnswered(false); setSelected(new Set()) }
  }
  const showResults = () => {
    const pct = Math.round((score / cards.length) * 100)
    saveHistory({ id: Date.now(), date: new Date().toLocaleString(), title: studyTitle, questions: cards.length, score: pct, cards: JSON.parse(JSON.stringify(cards)) })
    goTo('results')
  }

  // ── History ───────────────────────────────────────────────────────
  const replaySession = (s) => { setCards(s.cards); setStudyTitle(s.title); startQuiz(s.cards) }
  const deleteSession = (id) => {
    if (!confirm('Delete this session?')) return
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

  return (
    <>
      {screen !== 'onboard' && <button className="gear-btn" onClick={openSettings} title="Settings">⚙</button>}

      {screen === 'onboard' && <OnboardScreen obKey={obKey} setObKey={setObKey} obError={obError} onSave={handleOnboardSave} />}

      {screen === 'main' && (
        <MainScreen
          activeTab={activeTab} setActiveTab={setActiveTab}
          uploadedFiles={uploadedFiles} onAddFiles={addFiles} onRemoveFile={removeFile} onClearFiles={clearFiles}
          cardCount={cardCount} setCardCount={setCardCount}
          setupError={setupError} onGenerate={generate}
          history={history} onReplay={replaySession} onDelete={deleteSession} onExport={exportHistory}
        />
      )}

      {screen === 'load'    && <LoadingScreen />}
      {screen === 'quiz'    && <QuizScreen cards={cards} idx={idx} score={score} answered={answered} selected={selected} wrong={wrong} onPick={pick} onSubmit={submitAnswer} onNext={nextCard} onQuit={() => goTo('main')} />}
      {screen === 'results' && <ResultsScreen cards={cards} score={score} wrong={wrong} onRetry={retryQuiz} onNewDeck={() => goTo('main')} />}

      {settingsOpen && <SettingsModal maskedKey={maskedKey()} newKey={newKey} setNewKey={setNewKey} settingsError={settingsError} onSave={saveNewKey} onDelete={deleteKey} onClose={closeSettings} />}
    </>
  )
}
