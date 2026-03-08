import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import './App.css'
import { getData, saveData } from './lib/storage'
import { setupDailyReminder } from './lib/reminders'
import {
  evaluateSymptomPath,
  getCitationsForClaim,
  getClaimsByIds,
  getLearnTopics,
  getNextNodeId,
  getSourceFreshnessWarnings,
  getSuggestedEntrySymptoms,
  getTopCitedTopics,
  getTopicById,
  getTreeNode,
  hasDiagnosticPhrasing,
  symptoms,
  facts,
  type Claim,
  type Citation,
  type ConfidenceBand,
  type EvidenceTier,
} from './lib/symptomMapEngine'

type Mood = 'low' | 'okay' | 'good' | 'great'

type LogEntry = {
  id: string
  date: string
  mood: Mood
  energy: number
  symptoms: string[]
  periodStarted?: boolean
  note?: string
}

type AppData = {
  onboarded: boolean
  name: string
  age: string
  reminderTime: string
  remindersEnabled: boolean
  entries: LogEntry[]
}

const DEFAULT_DATA: AppData = {
  onboarded: false,
  name: '',
  age: '',
  reminderTime: '08:30',
  remindersEnabled: false,
  entries: [],
}

const quickSymptomOptions = ['Cramps', 'Headache', 'Brain fog', 'Anxiety', 'Bloating', 'Sleep issues']

const affirmations = [
  "Your worth is not tied to your productivity today.",
  "Rest is a requirement, not a reward.",
  "You are not lazy. You are managing a complex nervous system.",
  "It's okay to do things 'halfway' if that's all the energy you have.",
  "Forgive yourself for the things you didn't get done yesterday."
]

type TabId = 'today' | 'focus' | 'learn' | 'track' | 'me'
type LearnView = 'root' | 'topic' | 'map'
type FocusView = 'tasks' | 'timer' | 'rooms'

function confidenceLabel(value: ConfidenceBand) {
  if (value === 'high') return 'High confidence'
  if (value === 'medium') return 'Medium confidence'
  return 'Low confidence'
}

function EvidenceBadge({ tier }: { tier: EvidenceTier }) {
  return <span className={`evidence evidence-${tier.toLowerCase()}`}>Evidence: {tier}</span>
}

function ClaimRow({ claim }: { claim: Claim }) {
  const claimCitations = getCitationsForClaim(claim.id).slice(0, 3)
  return (
    <article className="claim-row">
      <p>{claim.plainLanguageText}</p>
      <div className="inline-sources">
        <EvidenceBadge tier={claim.evidenceTier} />
        {claimCitations.map((citation) => (
          <a key={citation.id} href={citation.url} target="_blank" rel="noreferrer">{citation.sourceOrg} ({citation.year})</a>
        ))}
      </div>
    </article>
  )
}

function SourceDrawer({ citations, open, setOpen }: { citations: Citation[]; open: boolean; setOpen: (next: boolean) => void }) {
  return (
    <section className="source-drawer">
      <button type="button" className="ghost" onClick={() => setOpen(!open)}>
        {open ? 'Hide sources' : 'See all sources'}
      </button>
      {open && (
        <ul>
          {citations.map((citation) => (
            <li key={citation.id}>
              <a href={citation.url} target="_blank" rel="noreferrer">{citation.title}</a>
              <span>{citation.sourceOrg} • {citation.year} • {citation.evidenceTier}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function App() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA)
  const [tab, setTab] = useState<TabId>('today')
  const [quickMood, setQuickMood] = useState<Mood>('okay')
  const [quickEnergy, setQuickEnergy] = useState(3)
  const [quickSymptoms, setQuickSymptoms] = useState<string[]>([])
  const [quickPeriodStarted, setQuickPeriodStarted] = useState(false)
  const [quickNote, setQuickNote] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  const [learnView, setLearnView] = useState<LearnView>('root')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)

  // Focus & tasks state
  const [focusView, setFocusView] = useState<FocusView>('tasks')
  const [tasks, setTasks] = useState<{ id: string; text: string; subtasks: string[]; completed: boolean }[]>([])
  const [newTaskInput, setNewTaskInput] = useState('')

  const [timerTarget, setTimerTarget] = useState<5 | 15 | 25>(25)
  const [timerMinutes, setTimerMinutes] = useState(25)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [plantStage, setPlantStage] = useState(0) // 0: seed, 1: sprout, 2: small plant, 3: blooming

  // Facts state
  const [currentFactIndex, setCurrentFactIndex] = useState(0)

  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([])
  const [mapStarted, setMapStarted] = useState(false)
  const [activeNodeId, setActiveNodeId] = useState<string>('frequency')
  const [nodeHistory, setNodeHistory] = useState<string[]>(['frequency'])
  const [answersByNodeId, setAnswersByNodeId] = useState<Record<string, string[]>>({})

  // Track AI Insight State
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiInsights, setAiInsights] = useState<string | null>(null)

  // Partner Sync State
  const [partnerEmail, setPartnerEmail] = useState('')
  const [showPartnerPreview, setShowPartnerPreview] = useState(false)

  // Daily Affirmation State
  const [currentAffirmationIndex] = useState(() => Math.floor(Math.random() * affirmations.length))

  useEffect(() => {
    getData<AppData>('app-data', DEFAULT_DATA).then(setData)
  }, [])

  useEffect(() => {
    saveData('app-data', data)
  }, [data])

  useEffect(() => {
    if (!statusMsg) return
    const id = window.setTimeout(() => setStatusMsg(''), 2500)
    return () => window.clearTimeout(id)
  }, [statusMsg])

  const sourceFreshnessWarnings = useMemo(() => getSourceFreshnessWarnings(), [])

  const insights = useMemo(() => {
    if (!data.entries.length) return ['No logs yet. Add one quick check-in to unlock patterns.']

    const week = data.entries.filter((e) => dayjs().diff(dayjs(e.date), 'day') <= 7)
    const avgEnergy = week.reduce((sum, e) => sum + e.energy, 0) / Math.max(week.length, 1)
    const lowDays = week.filter((e) => e.mood === 'low').length

    const symptomMap = new Map<string, number>()
    week.forEach((e) => e.symptoms.forEach((s) => symptomMap.set(s, (symptomMap.get(s) ?? 0) + 1)))
    const topSymptom = [...symptomMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

    return [
      `Average energy this week: ${avgEnergy.toFixed(1)} / 5`,
      `Low mood days this week: ${lowDays}`,
      topSymptom ? `Most common symptom this week: ${topSymptom}` : 'No dominant symptom pattern yet',
      'Try this: pair check-ins with an anchor habit (coffee, lunch, bedtime).',
    ]
  }, [data.entries])

  const selectedTopic = selectedTopicId ? getTopicById(selectedTopicId) : undefined
  const topicClaims = useMemo(() => (selectedTopic ? getClaimsByIds(selectedTopic.claimIds) : []), [selectedTopic])
  const topicCitations = useMemo(() => {
    if (!selectedTopic) return []
    const citations = new Map<string, Citation>()
    topicClaims.forEach((claim) => {
      getCitationsForClaim(claim.id).forEach((citation) => citations.set(citation.id, citation))
    })
    return [...citations.values()]
  }, [selectedTopic, topicClaims])

  const evaluation = useMemo(() => evaluateSymptomPath({ selectedSymptomIds, answersByNodeId }), [selectedSymptomIds, answersByNodeId])

  const activeNode = getTreeNode(activeNodeId)
  const activeNodeSelection = answersByNodeId[activeNodeId] ?? []

  const mapDone = mapStarted && !activeNode

  // Timer effect
  useEffect(() => {
    if (!timerActive) return
    const interval = setInterval(() => {
      if (timerSeconds > 0) {
        setTimerSeconds(timerSeconds - 1)
      } else if (timerMinutes > 0) {
        setTimerMinutes(timerMinutes - 1)
        setTimerSeconds(59)
      } else {
        setTimerActive(false)
      }

      // Check progression
      const totalSecondsPassed = (timerTarget * 60) - (timerMinutes * 60 + timerSeconds)
      const fraction = totalSecondsPassed / (timerTarget * 60)
      if (fraction >= 1) setPlantStage(3)
      else if (fraction >= 0.6) setPlantStage(2)
      else if (fraction >= 0.2) setPlantStage(1)
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive, timerMinutes, timerSeconds, timerTarget])

  const getPlantEmoji = () => {
    if (plantStage === 0) return '🌰'
    if (plantStage === 1) return '🌱'
    if (plantStage === 2) {
      if (timerTarget === 5) return '🌷'
      if (timerTarget === 15) return '🌿'
      return '🪴'
    }
    if (timerTarget === 5) return '🌸'
    if (timerTarget === 15) return '🥕'
    return '🌳'
  }
  const saveQuickLog = () => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mood: quickMood,
      energy: quickEnergy,
      symptoms: quickSymptoms,
      periodStarted: quickPeriodStarted,
      note: quickNote.trim() || undefined,
    }

    setData((prev) => ({ ...prev, entries: [entry, ...prev.entries] }))
    setQuickSymptoms([])
    setQuickNote('')
    setQuickPeriodStarted(false)
    setTab('track')
    setStatusMsg('Logged. You showed up.')
  }

  const applyReminder = async () => {
    const result = await setupDailyReminder(data.remindersEnabled, data.reminderTime)
    setStatusMsg(result.message)
  }

  const generateAiInsights = () => {
    setAiGenerating(true)
    // Simulate natural AI computation delay
    setTimeout(() => {
      setAiGenerating(false)
      if (data.entries.length < 2) {
        setAiInsights("You need a few more logs before AI can reliably detect patterns. Try logging for 3 consecutive days!")
      } else {
        const topSymptom = data.entries.flatMap(e => e.symptoms)[0] || 'Brain fog'
        setAiInsights(`✨ Spark AI noticed that you frequently log "${topSymptom}" around days when your energy dips below a 3/5. Tip: Protecting your sleep and aiming for a high-protein breakfast might help steady your dopamine levels and reduce the intensity of these crashes.`)
      }
    }, 2000)
  }

  const shareWithDoctor = async () => {
    if (data.entries.length === 0) {
      setStatusMsg("No logs to share yet.")
      return
    }

    const textPayload = data.entries.map(e =>
      `Date: ${dayjs(e.date).format('MMM D, YYYY')}\n` +
      `Mood: ${e.mood}, Energy: ${e.energy}/5\n` +
      (e.periodStarted ? `Cycle: Period Started\n` : '') +
      `Symptoms: ${e.symptoms.length > 0 ? e.symptoms.join(', ') : 'None'}\n` +
      (e.note ? `Note: ${e.note}\n` : '')
    ).join('\n---\n')

    const shareData = {
      title: 'My ADHD Health Logs',
      text: "Hello, here are my recent health logs exported from the ADHD Women's Health app:\n\n" + textPayload,
    }

    if (navigator.share && /iPad|iPhone|iPod|Android/.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData)
        setStatusMsg("Successfully opened share sheet!")
      } catch {
        setStatusMsg("Share cancelled.")
      }
    } else {
      navigator.clipboard.writeText(shareData.text)
        .then(() => setStatusMsg("Logs copied to clipboard! Paste into an email to your doctor."))
        .catch(() => setStatusMsg("Failed to copy clipboard."))
    }
  }

  const resetSymptomMap = () => {
    setMapStarted(false)
    setActiveNodeId('frequency')
    setNodeHistory(['frequency'])
    setAnswersByNodeId({})
  }

  const toggleMapOption = (nodeId: string, optionId: string, isMulti: boolean) => {
    setAnswersByNodeId((prev) => {
      const current = prev[nodeId] ?? []
      if (isMulti) {
        const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
        return { ...prev, [nodeId]: next }
      }
      return { ...prev, [nodeId]: [optionId] }
    })
  }

  const goForwardInMap = () => {
    if (!activeNode) return
    const selections = answersByNodeId[activeNode.id] ?? []
    if (!selections.length) {
      setStatusMsg('Select an option to continue')
      return
    }

    const nextNodeId = getNextNodeId(activeNode.id, selections)
    if (!nextNodeId) {
      setActiveNodeId('')
      return
    }

    setActiveNodeId(nextNodeId)
    setNodeHistory((prev) => [...prev, nextNodeId])
  }

  const goBackInMap = () => {
    if (nodeHistory.length <= 1) return
    const nextHistory = nodeHistory.slice(0, -1)
    const previous = nextHistory[nextHistory.length - 1]
    setNodeHistory(nextHistory)
    setActiveNodeId(previous)
  }

  const startSymptomMap = () => {
    if (!selectedSymptomIds.length) {
      setStatusMsg('Pick at least one symptom to start')
      return
    }
    resetSymptomMap()
    setMapStarted(true)
  }

  const addTaskAndBreakDown = () => {
    if (!newTaskInput.trim()) return
    // Simple heuristic-based breakdown simulation "Goblin Tools style"
    const subtasks = [
      'Gather materials needed',
      'Do the first small 5-minute step',
      'Complete the main portion',
      'Clean up and put things away'
    ]
    setTasks([{ id: crypto.randomUUID(), text: newTaskInput.trim(), subtasks, completed: false }, ...tasks])
    setNewTaskInput('')
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  // Get current cycle insight
  const cycleInsight = useMemo(() => {
    // Find last period start date
    const periodStarts = data.entries.filter((e) => e.periodStarted).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const lastPeriodDate = periodStarts[0]?.date

    if (!lastPeriodDate) return null
    const daysSincePeriod = dayjs().diff(dayjs(lastPeriodDate), 'day') + 1

    if (daysSincePeriod >= 1 && daysSincePeriod <= 5) return { title: 'Menstruation', text: 'Energy might be low. Focus on gentle tasks and rest.', icon: '🩸', warning: false }
    if (daysSincePeriod >= 6 && daysSincePeriod <= 13) return { title: 'Follicular Phase', text: 'Estrogen is rising! Great time for planning and focus work.', icon: '🌱', warning: false }
    if (daysSincePeriod >= 14 && daysSincePeriod <= 16) return { title: 'Ovulation', text: 'Energy peaks here. High social and physical stamina.', icon: '🌸', warning: false }
    if (daysSincePeriod >= 17 && daysSincePeriod <= 28) return { title: 'Luteal Phase', text: 'Progesterone rises. It is normal to feel brain fog or lower motivation.', icon: '🍂', warning: false }
    if (daysSincePeriod > 35) return { title: 'Irregular Cycle Detected', text: 'Your cycle is late. High stress, poor sleep, or changes to ADHD meds can impact ovulation. If persistently irregular, consult a doctor.', icon: '⚠️', warning: true }
    return null
  }, [data.entries])

  if (!data.onboarded) {
    return (
      <main className="shell">
        <section className="card">
          <h1>Welcome</h1>
          <p>Built for women with ADHD: fast logging, gentle reminders, and no shame language.</p>
          <label>
            What should we call you?
            <input value={data.name} onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} placeholder="Your name" />
          </label>
          <label>
            Preferred daily reminder
            <input type="time" value={data.reminderTime} onChange={(e) => setData((d) => ({ ...d, reminderTime: e.target.value }))} />
          </label>
          <button onClick={() => setData((d) => ({ ...d, onboarded: true }))} disabled={!data.name.trim()}>Start my dashboard</button>
        </section>
      </main>
    )
  }

  return (
    <main className="shell">
      <header className="app-header">
        <h1>Hi {data.name} 💜</h1>
        <p>{dayjs().format('dddd, MMM D')}</p>
      </header>

      {tab === 'today' && (
        <section className="card">
          <div className="affirmation-card" style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'var(--card-bg-subtle)' }}>
            <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.4' }}>"{affirmations[currentAffirmationIndex]}"</p>
          </div>

          <h2>Quick check-in (under 30s)</h2>

          {cycleInsight && (
            <div className="cycle-insight">
              <div className="cycle-insight-icon">{cycleInsight.icon}</div>
              <div className="cycle-insight-content">
                <h4>{cycleInsight.title}</h4>
                <p>{cycleInsight.text}</p>
              </div>
            </div>
          )}

          <label>
            Mood
            <select value={quickMood} onChange={(e) => setQuickMood(e.target.value as Mood)}>
              <option value="low">Low</option>
              <option value="okay">Okay</option>
              <option value="good">Good</option>
              <option value="great">Great</option>
            </select>
          </label>
          <label>
            Energy: {quickEnergy}/5
            <input type="range" min={1} max={5} value={quickEnergy} onChange={(e) => setQuickEnergy(Number(e.target.value))} />
          </label>
          <fieldset>
            <legend>Symptoms</legend>
            <div className="chips">
              {quickSymptomOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={quickSymptoms.includes(s) ? 'chip active' : 'chip'}
                  onClick={() => setQuickSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={quickPeriodStarted} onChange={(e) => setQuickPeriodStarted(e.target.checked)} style={{ width: 'auto', marginTop: 0 }} />
            Period started today?
          </label>
          <label>
            Tiny note (optional)
            <textarea value={quickNote} onChange={(e) => setQuickNote(e.target.value)} />
          </label>
          <button onClick={saveQuickLog}>Save today&apos;s log</button>
        </section>
      )}

      {tab === 'focus' && (
        <section className="card">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button className={focusView === 'tasks' ? '' : 'ghost'} onClick={() => setFocusView('tasks')} style={{ whiteSpace: 'nowrap' }}>Scaffold Tasks</button>
            <button className={focusView === 'timer' ? '' : 'ghost'} onClick={() => setFocusView('timer')} style={{ whiteSpace: 'nowrap' }}>Focus Timer</button>
            <button className={focusView === 'rooms' ? '' : 'ghost'} onClick={() => setFocusView('rooms')} style={{ whiteSpace: 'nowrap' }}>Focus Rooms ✨</button>
          </div>

          {focusView === 'tasks' && (
            <div className="learn-block" style={{ borderTop: 'none', paddingTop: 0 }}>
              <h2>Break it Down</h2>
              <p className="muted">Feeling overwhelmed? Put in a big task and we'll break it into tiny steps for you.</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="e.g. Clean the kitchen"
                  onKeyDown={(e) => e.key === 'Enter' && addTaskAndBreakDown()}
                />
                <button style={{ width: 'auto', padding: '14px 24px' }} onClick={addTaskAndBreakDown}>Magic Split ✨</button>
              </div>

              <div style={{ marginTop: '24px', display: 'grid', gap: '16px' }}>
                {tasks.map((task) => (
                  <div key={task.id} className="cause-card" style={{ opacity: task.completed ? 0.6 : 1 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: '1.1rem' }}>
                      <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} style={{ width: 'auto', minHeight: 'auto' }} />
                      <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.text}</span>
                    </label>
                    {!task.completed && (
                      <ul style={{ margin: '12px 0 0 12px', listStyleType: 'circle', color: 'var(--text-muted)' }}>
                        {task.subtasks.map((st, i) => (
                          <li key={i}>{st}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {focusView === 'timer' && (
            <div className="learn-block focus-timer" style={{ borderTop: 'none', paddingTop: 0 }}>
              <h2>Grow your Focus Plant</h2>
              <p className="muted" style={{ marginBottom: '16px' }}>Stay here and focus to grow your plant.</p>

              {!timerActive && plantStage === 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                  <button
                    className={timerTarget === 5 ? '' : 'ghost'}
                    onClick={() => { setTimerTarget(5); setTimerMinutes(5); setTimerSeconds(0); }}
                    style={{ whiteSpace: 'nowrap', padding: '8px 12px', fontSize: '0.9rem', width: 'auto' }}
                  >
                    5m Flower 🌸
                  </button>
                  <button
                    className={timerTarget === 15 ? '' : 'ghost'}
                    onClick={() => { setTimerTarget(15); setTimerMinutes(15); setTimerSeconds(0); }}
                    style={{ whiteSpace: 'nowrap', padding: '8px 12px', fontSize: '0.9rem', width: 'auto' }}
                  >
                    15m Veggie 🥕
                  </button>
                  <button
                    className={timerTarget === 25 ? '' : 'ghost'}
                    onClick={() => { setTimerTarget(25); setTimerMinutes(25); setTimerSeconds(0); }}
                    style={{ whiteSpace: 'nowrap', padding: '8px 12px', fontSize: '0.9rem', width: 'auto' }}
                  >
                    25m Tree 🌳
                  </button>
                </div>
              )}

              <div className="plant-reward">
                {getPlantEmoji()}
              </div>

              <div className="timer-display">
                {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={() => setTimerActive(!timerActive)}>
                  {timerActive ? 'Pause' : 'Start Focus'}
                </button>
                <button className="ghost" onClick={() => { setTimerActive(false); setTimerMinutes(timerTarget); setTimerSeconds(0); setPlantStage(0); }}>
                  Reset
                </button>
              </div>
            </div>
          )}

          {focusView === 'rooms' && (
            <div className="learn-block" style={{ borderTop: 'none', paddingTop: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Body Doubling</h2>
                <span style={{ fontSize: '0.75rem', background: '#34c759', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>LIVE</span>
              </div>

              <div style={{ background: 'var(--card-bg-subtle)', borderRadius: '12px', padding: '16px', marginTop: '16px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 24px', position: 'relative' }}>
                  <div className="avatar" style={{ zIndex: 4, background: '#f0e6ff' }}>A</div>
                  <div className="avatar" style={{ zIndex: 3, marginLeft: '-12px', background: '#e0c8ff' }}>K</div>
                  <div className="avatar" style={{ zIndex: 2, marginLeft: '-12px', background: '#ffd1dc' }}>M</div>
                  <div className="avatar" style={{ zIndex: 1, marginLeft: '-12px', background: '#d1ebff' }}>S</div>
                </div>
                <p style={{ margin: 0, fontSize: '1.2rem' }}><strong>14,204 women</strong> are focusing right now.</p>

                <div style={{ textAlign: 'left', background: 'white', padding: '16px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem' }}>How it works 💡</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    This isn't a phone call or a Zoom meeting. It's a <strong>silent, camera-off co-working space</strong>.
                    You drop in, keep your microphone muted, and work quietly alongside other women. Just knowing someone else is there "body doubling" with you anchors your focus without the anxiety of a 1-on-1 call.
                  </p>
                </div>

                <button style={{ marginTop: '24px', width: '100%' }} onClick={() => setFocusView('timer')}>Join Next Session</button>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'learn' && (
        <section className="card">
          {learnView === 'root' && (
            <>
              <h2>Learn</h2>
              <p className="muted">Evidence-backed resources tailored to what you want to learn right now.</p>

              <article className="learn-block">
                <h3>Did you know?</h3>
                <div className="fact-card">
                  <p>{facts[currentFactIndex].factText}</p>
                  <p className="tip">💡 {facts[currentFactIndex].tipText}</p>
                </div>
                <button type="button" className="ghost" style={{ marginTop: '8px' }} onClick={() => setCurrentFactIndex((i) => (i + 1) % facts.length)}>
                  Show next fact
                </button>
              </article>

              <article className="learn-block">
                <h3>Browse by symptom</h3>
                <div className="chips">
                  {symptoms.map((symptom) => (
                    <button
                      key={symptom.id}
                      type="button"
                      className={selectedSymptomIds.includes(symptom.id) ? 'chip active' : 'chip'}
                      onClick={() => {
                        setSelectedSymptomIds((prev) =>
                          prev.includes(symptom.id) ? prev.filter((id) => id !== symptom.id) : [...prev, symptom.id],
                        )
                      }}
                    >
                      {symptom.label}
                    </button>
                  ))}
                </div>
              </article>

              <article className="learn-block">
                <h3>Start symptom map</h3>
                <p className="muted">Not a medical diagnosis. This map ranks educational likely-cause patterns based on your answers.</p>
                <button onClick={() => { setLearnView('map'); startSymptomMap() }}>Start symptom map</button>
              </article>

              <article className="learn-block">
                <h3>Top cited topics</h3>
                <div className="topic-list">
                  {getTopCitedTopics().map(({ topic, citationCount }) => (
                    <button
                      type="button"
                      key={topic.id}
                      className="topic-card"
                      onClick={() => {
                        setSelectedTopicId(topic.id)
                        setSourceDrawerOpen(false)
                        setLearnView('topic')
                      }}
                    >
                      <strong>{topic.title}</strong>
                      <span>{topic.symptomFocus}</span>
                      <span>{citationCount} cited sources</span>
                    </button>
                  ))}
                </div>
              </article>

              {sourceFreshnessWarnings.length > 0 && (
                <article className="warning-inline">
                  <strong>Source freshness check</strong>
                  <p>{sourceFreshnessWarnings.length} source(s) are older than policy and flagged for review before release.</p>
                </article>
              )}
            </>
          )}

          {learnView === 'topic' && selectedTopic && (
            <>
              <button type="button" className="ghost" onClick={() => setLearnView('root')}>Back to Learn</button>
              <h2>{selectedTopic.title}</h2>
              <p><strong>What this means:</strong> {selectedTopic.whatThisMeans}</p>
              <p><strong>How it can relate to ADHD/cycle:</strong> {selectedTopic.adhdCycleLink}</p>
              <p><strong>What to track:</strong> {selectedTopic.whatToTrack}</p>

              <div className="claim-list">
                {topicClaims.map((claim) => <ClaimRow key={claim.id} claim={claim} />)}
              </div>

              <SourceDrawer citations={topicCitations} open={sourceDrawerOpen} setOpen={setSourceDrawerOpen} />
            </>
          )}

          {learnView === 'map' && (
            <>
              <button type="button" className="ghost" onClick={() => setLearnView('root')}>Back to Learn</button>
              <h2>Symptom map</h2>
              <p className="muted">Educational support only. This does not diagnose a condition.</p>

              <article className="learn-block">
                <h3>Entry symptoms</h3>
                <p className="muted">Pick at least one symptom, then follow one branch step at a time.</p>
                <div className="chips">
                  {symptoms.map((symptom) => (
                    <button
                      key={symptom.id}
                      type="button"
                      className={selectedSymptomIds.includes(symptom.id) ? 'chip active' : 'chip'}
                      onClick={() => {
                        setSelectedSymptomIds((prev) =>
                          prev.includes(symptom.id) ? prev.filter((id) => id !== symptom.id) : [...prev, symptom.id],
                        )
                      }}
                    >
                      {symptom.label}
                    </button>
                  ))}
                </div>
                {!selectedSymptomIds.length && (
                  <p className="muted">
                    Suggested: {getSuggestedEntrySymptoms().map((symptom) => symptom.label).join(', ')}
                  </p>
                )}
              </article>

              {mapStarted && (
                <article className="map-layout">
                  <div className="map-path">
                    <strong>Branch path</strong>
                    <ol>
                      {nodeHistory.map((nodeId) => {
                        const node = getTreeNode(nodeId)
                        if (!node) return null
                        return (
                          <li key={nodeId} className={activeNodeId === nodeId ? 'active-path' : ''}>{node.question}</li>
                        )
                      })}
                    </ol>
                  </div>

                  {activeNode && (
                    <div className="map-step">
                      <h3>{activeNode.question}</h3>
                      <div className="map-options">
                        {activeNode.options.map((option) => {
                          const selected = activeNodeSelection.includes(option.id)
                          return (
                            <button
                              key={option.id}
                              type="button"
                              className={selected ? 'chip active' : 'chip'}
                              onClick={() => toggleMapOption(activeNode.id, option.id, activeNode.inputType === 'multi')}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                      <div className="map-actions">
                        <button type="button" className="ghost" onClick={goBackInMap} disabled={nodeHistory.length <= 1}>Back</button>
                        <button type="button" onClick={goForwardInMap}>Continue</button>
                        <button type="button" className="ghost" onClick={resetSymptomMap}>Reset map</button>
                      </div>
                    </div>
                  )}
                </article>
              )}

              {evaluation.safetyFlags.length > 0 && (
                <article className="warning-banner" role="alert" aria-live="polite">
                  <strong>Safety heads-up</strong>
                  {evaluation.safetyFlags.map((flag) => (
                    <div key={flag.id} className="warning-row">
                      <p>{flag.message}</p>
                      <a href={flag.ctaRoute}>{flag.ctaText}</a>
                    </div>
                  ))}
                </article>
              )}

              {mapDone && (
                <article className="results-panel">
                  <h3>Likely-cause patterns</h3>
                  <p className="muted">These are possible explanations to discuss with your clinician, not diagnoses.</p>
                  <p className="muted">{evaluation.confidenceNote}</p>

                  {evaluation.contradictorySignals.length > 0 && (
                    <div className="uncertainty-box">
                      <strong>Uncertainty detected</strong>
                      <ul>
                        {evaluation.contradictorySignals.map((signal) => <li key={signal}>{signal}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="cause-list">
                    {evaluation.rankedLikelyCauses.map((cause) => {
                      const phrases = [cause.summary, cause.why, cause.whatToTrack, cause.seekCareWhen].join(' ')
                      const containsDiagnostic = hasDiagnosticPhrasing(phrases)
                      const relatedTopic = getLearnTopics().find((topic) => cause.relatedArticleIds.includes(topic.id))

                      return (
                        <article key={cause.id} className="cause-card">
                          <header>
                            <h4>{cause.name}</h4>
                            <span>{confidenceLabel(cause.confidenceBand)}</span>
                          </header>
                          <p><strong>Why this appeared:</strong> {cause.why}</p>
                          <p><strong>What to track (3-7 days):</strong> {cause.whatToTrack}</p>
                          <p><strong>When to seek care:</strong> {cause.seekCareWhen}</p>
                          <div className="inline-sources">
                            <EvidenceBadge tier={cause.evidenceTier} />
                            {relatedTopic && (
                              <button
                                type="button"
                                className="ghost link-button"
                                onClick={() => {
                                  setSelectedTopicId(relatedTopic.id)
                                  setLearnView('topic')
                                }}
                              >
                                Related article: {relatedTopic.title}
                              </button>
                            )}
                          </div>
                          {containsDiagnostic && <p className="muted">Copy guard: revise language before release.</p>}
                        </article>
                      )
                    })}
                  </div>
                </article>
              )}
            </>
          )}
        </section>
      )}

      {tab === 'track' && (
        <section className="card">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ marginBottom: 0 }}>Your patterns</h2>
            <button onClick={shareWithDoctor} className="ghost" style={{ width: 'auto', margin: 0, padding: '8px 16px', fontSize: '0.9rem' }}>
              Export for Doctor
            </button>
          </header>

          <article className="learn-block" style={{ marginTop: '0', background: 'linear-gradient(135deg, rgba(123, 94, 167, 0.05) 0%, rgba(200, 150, 255, 0.05) 100%)', padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>AI Pattern Analysis ✨</h3>
              <span style={{ fontSize: '0.75rem', background: 'var(--primary-color)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>PREMIUM</span>
            </div>
            {aiInsights ? (
              <p style={{ marginTop: '12px', lineHeight: 1.6 }}>{aiInsights}</p>
            ) : aiGenerating ? (
              <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}><em>AI is analyzing your logs...</em></p>
            ) : (
              <>
                <p className="muted" style={{ marginTop: '8px' }}>Unlock personalized, deep-dive insights into how your cycle, sleep, and symptoms interact over time.</p>
                <button onClick={generateAiInsights} style={{ marginTop: '12px' }}>Generate Demo Insights</button>
              </>
            )}
          </article>

          <article className="learn-block">
            <h3>This week</h3>
            <ul>
              {insights.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </article>

          <article className="learn-block">
            <h3>Recent logs</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {data.entries.slice(0, 10).map((entry) => (
                <li key={entry.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>{dayjs(entry.date).format('MMM D, h:mm A')}</strong>
                  Mood: {entry.mood} | Energy: {entry.energy}/5 {entry.periodStarted && '| 🩸 Period'}
                  {entry.symptoms.length > 0 && <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Symptoms: {entry.symptoms.join(', ')}</div>}
                </li>
              ))}
            </ul>
          </article>
        </section>
      )}

      {tab === 'me' && (
        <section className="card">
          <header style={{ marginBottom: '24px' }}>
            <h2>Me ({data.name})</h2>
            <p className="muted">Manage your settings and find support.</p>
          </header>

          <article className="learn-block">
            <h3>Profile & Tracking</h3>
            <label>
              Your Name
              <input value={data.name} onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} />
            </label>
            <label>
              Age
              <input type="number" value={data.age} onChange={(e) => setData((d) => ({ ...d, age: e.target.value }))} placeholder="Your age" />
            </label>
          </article>

          <article className="learn-block">
            <h3>Notification settings</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="checkbox" checked={data.remindersEnabled} onChange={(e) => setData((d) => ({ ...d, remindersEnabled: e.target.checked }))} style={{ width: 'auto' }} />
              Enable daily reminders
            </label>
            <label>
              Reminder time
              <input type="time" value={data.reminderTime} onChange={(e) => setData((d) => ({ ...d, reminderTime: e.target.value }))} />
            </label>
            <button onClick={applyReminder}>Apply reminder</button>
          </article>

          <article className="learn-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Partner Sync</h3>
              <span style={{ fontSize: '0.75rem', background: 'var(--primary-color)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>PREMIUM</span>
            </div>
            <p className="muted" style={{ marginTop: '8px', fontSize: '0.9rem' }}>Keep your partner in the loop about your energy and cycle without having to explain it yourself.</p>
            <label style={{ marginTop: '12px' }}>
              Partner's Email
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="email" placeholder="partner@example.com" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} />
                <button style={{ width: 'auto' }}>Invite</button>
              </div>
            </label>
            <button className="ghost" style={{ marginTop: '8px', padding: '8px', fontSize: '0.9rem' }} onClick={() => setShowPartnerPreview(!showPartnerPreview)}>
              Preview what they see
            </button>
            {showPartnerPreview && (
              <div style={{ marginTop: '12px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                  <strong>Push Notification to {partnerEmail || 'Partner'}:</strong><br />
                  "Sarah's energy is a {data.entries[0]?.energy || quickEnergy}/5 today {data.entries[0]?.periodStarted ? 'and she is on her cycle' : ''}. Great night to order takeout or offer a little extra grace!"
                </p>
              </div>
            )}
          </article>

          <article className="learn-block">
            <h3>Support & Resources</h3>
            <div className="topic-list">
              <a href="https://chadd.org/" target="_blank" rel="noreferrer" className="topic-card" style={{ textDecoration: 'none' }}>
                <strong>CHADD</strong>
                <span>Children and Adults with ADHD Organization. High-quality facts and support.</span>
              </a>
              <a href="https://add.org/" target="_blank" rel="noreferrer" className="topic-card" style={{ textDecoration: 'none' }}>
                <strong>ADDA</strong>
                <span>Attention Deficit Disorder Association specifically focused on adults.</span>
              </a>
              <a href="tel:988" className="topic-card" style={{ textDecoration: 'none', background: '#fdf2f1', border: '1px solid #e07060' }}>
                <strong style={{ color: '#b0382b' }}>988 Suicide & Crisis Lifeline</strong>
                <span style={{ color: '#4a1f1a' }}>Free, confidential support available 24/7 if you are in distress.</span>
              </a>
              <a href="mailto:ideas@sparkadhd.app?subject=App%20Suggestion" className="topic-card" style={{ textDecoration: 'none', background: 'var(--card-bg-subtle)' }}>
                <strong>💡 Suggest a Feature</strong>
                <span>Have an idea to make this app better for your ADHD? We'd love to hear it.</span>
              </a>
            </div>
          </article>
        </section>
      )}

      {statusMsg && <p className="toast">{statusMsg}</p>}

      <nav className="tabs" aria-label="Primary tabs">
        {[
          ['today', 'Today'],
          ['focus', 'Focus'],
          ['learn', 'Learn'],
          ['track', 'Track'],
          ['me', 'Me'],
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? 'tab active' : 'tab'} onClick={() => setTab(id as TabId)}>{label}</button>
        ))}
      </nav>
    </main>
  )
}

export default App
