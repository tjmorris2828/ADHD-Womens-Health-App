export type EvidenceTier = 'High' | 'Medium' | 'Low'
export type ConfidenceBand = 'low' | 'medium' | 'high'

export type Symptom = {
  id: string
  label: string
  category: 'pain' | 'mood' | 'cognitive' | 'sleep' | 'cycle' | 'energy'
  aliases: string[]
  severityOptions: string[]
}

export type Claim = {
  id: string
  plainLanguageText: string
  evidenceTier: EvidenceTier
  citationIds: string[]
}

export type Citation = {
  id: string
  title: string
  sourceOrg: string
  year: number
  url: string
  evidenceTier: EvidenceTier
  claimIds: string[]
}

export type SafetyFlag = {
  id: string
  triggerRule: string
  message: string
  urgency: 'warning' | 'urgent'
  ctaText: string
  ctaRoute: string
}

export type LikelyCause = {
  id: string
  name: string
  summary: string
  confidenceBand: ConfidenceBand
  evidenceTier: EvidenceTier
  redFlagRelated: boolean
  whatToTrack: string
  seekCareWhen: string
  relatedArticleIds: string[]
}

export type TreeNodeInputType = 'single' | 'multi' | 'scale' | 'boolean'

export type TreeOption = {
  id: string
  label: string
  scoreDelta?: Partial<Record<CauseId, number>>
  safetyFlagIds?: string[]
  nextNodeId?: string
}

export type TreeNode = {
  id: string
  question: string
  inputType: TreeNodeInputType
  options: TreeOption[]
  nextNodeRules: Array<{
    optionId: string
    nextNodeId?: string
  }>
}

type CauseId = 'pmdd_window' | 'sleep_debt' | 'stress_load' | 'thyroid_pattern' | 'iron_pattern'

type Topic = {
  id: string
  title: string
  symptomFocus: string
  whatThisMeans: string
  adhdCycleLink: string
  whatToTrack: string
  claimIds: [string, string, string]
}

export const SOURCE_FRESHNESS_YEARS = 8

export const symptoms: Symptom[] = [
  { id: 'brain_fog', label: 'Brain fog', category: 'cognitive', aliases: ['foggy', 'mental fatigue'], severityOptions: ['mild', 'moderate', 'high'] },
  { id: 'sleep_issues', label: 'Sleep issues', category: 'sleep', aliases: ['insomnia', 'restless sleep'], severityOptions: ['occasional', 'weekly', 'most_days'] },
  { id: 'mood_swings', label: 'Mood swings', category: 'mood', aliases: ['irritability', 'emotional swings'], severityOptions: ['mild', 'moderate', 'high'] },
  { id: 'fatigue', label: 'Fatigue', category: 'energy', aliases: ['low energy', 'energy crash'], severityOptions: ['mild', 'moderate', 'high'] },
  { id: 'inattention', label: 'Inattention', category: 'cognitive', aliases: ['spacing out', 'losing train of thought'], severityOptions: ['mild', 'moderate', 'high'] },
  { id: 'time_blindness', label: 'Time blindness', category: 'cognitive', aliases: ['always late', 'underestimating time'], severityOptions: ['mild', 'moderate', 'high'] },
  { id: 'emotional_dysregulation', label: 'Emotional dysregulation', category: 'mood', aliases: ['oversensitive', 'intense feelings'], severityOptions: ['mild', 'moderate', 'high'] },
  { id: 'hyperfocus', label: 'Hyperfocus', category: 'cognitive', aliases: ['getting stuck on tasks', 'losing track of time'], severityOptions: ['occasional', 'weekly', 'most_days'] },
  { id: 'clutter', label: 'Chronic clutter', category: 'cognitive', aliases: ['disorganization', 'losing things'], severityOptions: ['mild', 'moderate', 'high'] },
  { id: 'cramps', label: 'Cramps', category: 'pain', aliases: ['pelvic pain'], severityOptions: ['mild', 'moderate', 'severe'] },
  { id: 'headache', label: 'Headache', category: 'pain', aliases: ['migraine'], severityOptions: ['occasional', 'weekly', 'most_days'] },
]

export type Fact = {
  id: string
  factText: string
  tipText: string
}

export const facts: Fact[] = [
  { id: 'fact1', factText: 'Women are often diagnosed with ADHD later in life (between 16-28) because they tend to internalize symptoms rather than acting out.', tipText: 'Trust your lived experience. Your struggles are real even if you mask them well.' },
  { id: 'fact2', factText: 'Hormonal fluctuations can significantly impact ADHD. Lower estrogen levels (like before a period) decrease dopamine, worsening symptom severity.', tipText: 'Give yourself grace during the late luteal phase; it is chemically harder to focus.' },
  { id: 'fact3', factText: 'ADHD in women is highly comorbid with anxiety and depression, often leading to misdiagnosis.', tipText: 'If standard anxiety treatments aren\'t fully working, explore ADHD screening.' },
  { id: 'fact4', factText: 'Hyperfocus is a common ADHD trait where you become deeply absorbed in an activity to the exclusion of everything else.', tipText: 'Set external alarms or enlist a "body double" to help break out of hyperfocus blocks.' },
  { id: 'fact5', factText: 'Many women with ADHD struggle heavily with "time blindness," making it hard to estimate how long tasks will take.', tipText: 'Add a 50% buffer to your time estimates and use visual timers to see time passing.' }
]

export const claims: Claim[] = [
  {
    id: 'pmdd_summary',
    plainLanguageText: 'Premenstrual hormone shifts can intensify mood symptoms in some women with ADHD traits.',
    evidenceTier: 'Medium',
    citationIds: ['cit_apa_pmdd', 'cit_nimh_pmdd'],
  },
  {
    id: 'pmdd_adhd_link',
    plainLanguageText: 'ADHD-related emotion regulation challenges can feel heavier in late luteal days.',
    evidenceTier: 'Medium',
    citationIds: ['cit_jad_adhd_pmdd'],
  },
  {
    id: 'pmdd_action',
    plainLanguageText: 'Track mood for 7-10 days before your period to spot repeating windows.',
    evidenceTier: 'High',
    citationIds: ['cit_acog_pms'],
  },
  {
    id: 'sleep_summary',
    plainLanguageText: 'Short or fragmented sleep can lower focus and increase emotional reactivity the next day.',
    evidenceTier: 'High',
    citationIds: ['cit_cdc_sleep', 'cit_ninds_sleep'],
  },
  {
    id: 'sleep_adhd_link',
    plainLanguageText: 'Sleep disruption can amplify ADHD symptoms like inattention and impulsivity.',
    evidenceTier: 'High',
    citationIds: ['cit_nimh_adhd'],
  },
  {
    id: 'sleep_action',
    plainLanguageText: 'Track sleep hours, wake quality, and next-day energy for 3-7 days.',
    evidenceTier: 'High',
    citationIds: ['cit_cdc_sleep'],
  },
  {
    id: 'thyroid_summary',
    plainLanguageText: 'Thyroid changes can overlap with fatigue, mood changes, and concentration issues.',
    evidenceTier: 'High',
    citationIds: ['cit_niddk_thyroid'],
  },
  {
    id: 'thyroid_adhd_link',
    plainLanguageText: 'When focus changes abruptly with energy shifts, thyroid patterns are worth discussing with a clinician.',
    evidenceTier: 'Medium',
    citationIds: ['cit_niddk_thyroid'],
  },
  {
    id: 'thyroid_action',
    plainLanguageText: 'Track fatigue, sleep, cycle timing, and temperature sensitivity before your appointment.',
    evidenceTier: 'Low',
    citationIds: ['cit_mayoclinic_hypothyroid'],
  },
]

export const citations: Citation[] = [
  {
    id: 'cit_apa_pmdd',
    title: 'Premenstrual Dysphoric Disorder (PMDD)',
    sourceOrg: 'American Psychiatric Association',
    year: 2024,
    url: 'https://www.psychiatry.org/patients-families/pmdd/what-is-pmdd',
    evidenceTier: 'Medium',
    claimIds: ['pmdd_summary'],
  },
  {
    id: 'cit_nimh_pmdd',
    title: 'Premenstrual Dysphoric Disorder',
    sourceOrg: 'NIMH',
    year: 2023,
    url: 'https://www.nimh.nih.gov/health/publications/premenstrual-dysphoric-disorder',
    evidenceTier: 'Medium',
    claimIds: ['pmdd_summary'],
  },
  {
    id: 'cit_jad_adhd_pmdd',
    title: 'ADHD symptoms across menstrual phases',
    sourceOrg: 'Journal of Attention Disorders',
    year: 2023,
    url: 'https://journals.sagepub.com/home/jad',
    evidenceTier: 'Medium',
    claimIds: ['pmdd_adhd_link'],
  },
  {
    id: 'cit_acog_pms',
    title: 'Premenstrual Syndrome (PMS)',
    sourceOrg: 'ACOG',
    year: 2024,
    url: 'https://www.acog.org/womens-health/faqs/premenstrual-syndrome',
    evidenceTier: 'High',
    claimIds: ['pmdd_action'],
  },
  {
    id: 'cit_cdc_sleep',
    title: 'Sleep and Sleep Disorders',
    sourceOrg: 'CDC',
    year: 2024,
    url: 'https://www.cdc.gov/sleep/index.html',
    evidenceTier: 'High',
    claimIds: ['sleep_summary', 'sleep_action'],
  },
  {
    id: 'cit_ninds_sleep',
    title: 'Brain Basics: Understanding Sleep',
    sourceOrg: 'NINDS',
    year: 2023,
    url: 'https://www.ninds.nih.gov/health-information/public-education/brain-basics/brain-basics-understanding-sleep',
    evidenceTier: 'High',
    claimIds: ['sleep_summary'],
  },
  {
    id: 'cit_nimh_adhd',
    title: 'Attention-Deficit/Hyperactivity Disorder',
    sourceOrg: 'NIMH',
    year: 2024,
    url: 'https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd',
    evidenceTier: 'High',
    claimIds: ['sleep_adhd_link'],
  },
  {
    id: 'cit_niddk_thyroid',
    title: 'Thyroid Disease',
    sourceOrg: 'NIDDK',
    year: 2023,
    url: 'https://www.niddk.nih.gov/health-information/endocrine-diseases/thyroid-disease',
    evidenceTier: 'High',
    claimIds: ['thyroid_summary', 'thyroid_adhd_link'],
  },
  {
    id: 'cit_mayoclinic_hypothyroid',
    title: 'Hypothyroidism Symptoms and Causes',
    sourceOrg: 'Mayo Clinic',
    year: 2022,
    url: 'https://www.mayoclinic.org/diseases-conditions/hypothyroidism/symptoms-causes/syc-20350284',
    evidenceTier: 'Low',
    claimIds: ['thyroid_action'],
  },
]

export const safetyFlags: SafetyFlag[] = [
  {
    id: 'redflag_severe_pain',
    triggerRule: 'severe pelvic pain',
    message: 'Severe or sudden pain can need urgent medical review. You can keep exploring, but please consider same-day care.',
    urgency: 'urgent',
    ctaText: 'Find urgent care guidance',
    ctaRoute: '/care/urgent',
  },
  {
    id: 'redflag_heavy_bleeding',
    triggerRule: 'heavy bleeding',
    message: 'Heavy bleeding may need prompt care. Keep this branch visible and seek care quickly if symptoms worsen.',
    urgency: 'urgent',
    ctaText: 'Review heavy bleeding guidance',
    ctaRoute: '/care/heavy-bleeding',
  },
  {
    id: 'redflag_mood_crisis',
    triggerRule: 'self-harm thoughts',
    message: 'If you might harm yourself or feel unsafe, seek emergency support now. You are not alone.',
    urgency: 'urgent',
    ctaText: 'Get immediate support resources',
    ctaRoute: '/care/crisis',
  },
]

export const treeNodes: TreeNode[] = [
  {
    id: 'frequency',
    question: 'How often is this symptom happening?',
    inputType: 'single',
    options: [
      { id: 'freq_occasional', label: 'Occasional', scoreDelta: { sleep_debt: 1, stress_load: 1 }, nextNodeId: 'sleep_quality' },
      { id: 'freq_weekly', label: 'Weekly', scoreDelta: { pmdd_window: 2, thyroid_pattern: 1, iron_pattern: 1 }, nextNodeId: 'cycle_window' },
      { id: 'freq_most_days', label: 'Most days', scoreDelta: { thyroid_pattern: 2, iron_pattern: 2, sleep_debt: 2 }, nextNodeId: 'cycle_window' },
    ],
    nextNodeRules: [
      { optionId: 'freq_occasional', nextNodeId: 'sleep_quality' },
      { optionId: 'freq_weekly', nextNodeId: 'cycle_window' },
      { optionId: 'freq_most_days', nextNodeId: 'cycle_window' },
    ],
  },
  {
    id: 'cycle_window',
    question: 'Does it cluster around your premenstrual days?',
    inputType: 'single',
    options: [
      { id: 'cycle_yes', label: 'Yes, mostly in the week before my period', scoreDelta: { pmdd_window: 4 }, nextNodeId: 'sleep_quality' },
      { id: 'cycle_no', label: 'No, it is spread out through the month', scoreDelta: { thyroid_pattern: 1, sleep_debt: 1 }, nextNodeId: 'sleep_quality' },
      { id: 'cycle_unsure', label: 'Not sure yet', scoreDelta: { stress_load: 1 }, nextNodeId: 'sleep_quality' },
    ],
    nextNodeRules: [
      { optionId: 'cycle_yes', nextNodeId: 'sleep_quality' },
      { optionId: 'cycle_no', nextNodeId: 'sleep_quality' },
      { optionId: 'cycle_unsure', nextNodeId: 'sleep_quality' },
    ],
  },
  {
    id: 'sleep_quality',
    question: 'How has sleep been this week?',
    inputType: 'single',
    options: [
      { id: 'sleep_poor', label: 'Fragmented or short most nights', scoreDelta: { sleep_debt: 4, stress_load: 1 }, nextNodeId: 'stress_level' },
      { id: 'sleep_mixed', label: 'Mixed, some good nights and some rough', scoreDelta: { sleep_debt: 2, stress_load: 1 }, nextNodeId: 'stress_level' },
      { id: 'sleep_good', label: 'Mostly solid sleep', scoreDelta: { thyroid_pattern: 1, iron_pattern: 1 }, nextNodeId: 'red_flags' },
    ],
    nextNodeRules: [
      { optionId: 'sleep_poor', nextNodeId: 'stress_level' },
      { optionId: 'sleep_mixed', nextNodeId: 'stress_level' },
      { optionId: 'sleep_good', nextNodeId: 'red_flags' },
    ],
  },
  {
    id: 'stress_level',
    question: 'How high has stress load been lately?',
    inputType: 'single',
    options: [
      { id: 'stress_high', label: 'High and sustained', scoreDelta: { stress_load: 4, sleep_debt: 1 }, nextNodeId: 'red_flags' },
      { id: 'stress_medium', label: 'Moderate', scoreDelta: { stress_load: 2 }, nextNodeId: 'red_flags' },
      { id: 'stress_low', label: 'Mostly manageable', scoreDelta: { pmdd_window: 1, thyroid_pattern: 1 }, nextNodeId: 'red_flags' },
    ],
    nextNodeRules: [
      { optionId: 'stress_high', nextNodeId: 'red_flags' },
      { optionId: 'stress_medium', nextNodeId: 'red_flags' },
      { optionId: 'stress_low', nextNodeId: 'red_flags' },
    ],
  },
  {
    id: 'red_flags',
    question: 'Any high-risk signs right now?',
    inputType: 'multi',
    options: [
      { id: 'flag_none', label: 'None of these', scoreDelta: {}, nextNodeId: undefined },
      { id: 'flag_severe_pain', label: 'Severe sudden pain', safetyFlagIds: ['redflag_severe_pain'] },
      { id: 'flag_heavy_bleeding', label: 'Very heavy bleeding', safetyFlagIds: ['redflag_heavy_bleeding'] },
      { id: 'flag_mood_crisis', label: 'I feel unsafe or in crisis', safetyFlagIds: ['redflag_mood_crisis'] },
    ],
    nextNodeRules: [
      { optionId: 'flag_none', nextNodeId: undefined },
      { optionId: 'flag_severe_pain', nextNodeId: undefined },
      { optionId: 'flag_heavy_bleeding', nextNodeId: undefined },
      { optionId: 'flag_mood_crisis', nextNodeId: undefined },
    ],
  },
]

const topics: Topic[] = [
  {
    id: 'topic_pmdd',
    title: 'PMDD and mood shifts',
    symptomFocus: 'Mood swings and irritability',
    whatThisMeans: 'Some symptom windows line up with hormone shifts before a period. Knowing your timing can reduce uncertainty.',
    adhdCycleLink: 'Late-luteal days may feel harder for task initiation and emotion regulation in ADHD brains.',
    whatToTrack: 'Track mood, sleep, and cycle day for 7-10 days before your period.',
    claimIds: ['pmdd_summary', 'pmdd_adhd_link', 'pmdd_action'],
  },
  {
    id: 'topic_sleep_focus',
    title: 'Sleep, focus, and next-day energy',
    symptomFocus: 'Brain fog and fatigue',
    whatThisMeans: 'Sleep quantity and sleep quality both affect attention, mood, and resilience the next day.',
    adhdCycleLink: 'When sleep drops, ADHD symptoms usually feel louder, especially during hormonally sensitive days.',
    whatToTrack: 'Track sleep hours, wake quality, caffeine timing, and next-day focus for 3-7 days.',
    claimIds: ['sleep_summary', 'sleep_adhd_link', 'sleep_action'],
  },
  {
    id: 'topic_thyroid_overlap',
    title: 'Thyroid overlap with ADHD symptoms',
    symptomFocus: 'Fatigue, low focus, mood changes',
    whatThisMeans: 'Some endocrine patterns can feel similar to ADHD-related burnout or cycle-linked fatigue.',
    adhdCycleLink: 'If your focus shifts abruptly with energy changes, thyroid screening can be worth discussing.',
    whatToTrack: 'Track fatigue level, cycle timing, cold sensitivity, and concentration changes.',
    claimIds: ['thyroid_summary', 'thyroid_adhd_link', 'thyroid_action'],
  },
]

const symptomBaseScore: Record<string, Partial<Record<CauseId, number>>> = {
  brain_fog: { sleep_debt: 2, thyroid_pattern: 1, stress_load: 1 },
  sleep_issues: { sleep_debt: 3, stress_load: 1 },
  mood_swings: { pmdd_window: 2, stress_load: 2 },
  fatigue: { iron_pattern: 2, thyroid_pattern: 2, sleep_debt: 1 },
  cramps: { pmdd_window: 2, iron_pattern: 1 },
  headache: { stress_load: 1, pmdd_window: 1, sleep_debt: 1 },
}

const causeTemplates: Record<CauseId, Omit<LikelyCause, 'confidenceBand'>> = {
  pmdd_window: {
    id: 'pmdd_window',
    name: 'Premenstrual mood-sensitivity window',
    summary: 'Your inputs suggest symptoms may cluster in a premenstrual hormone window.',
    evidenceTier: 'Medium',
    redFlagRelated: false,
    whatToTrack: 'Track mood + sleep in the 7-10 days before your period for the next two cycles.',
    seekCareWhen: 'Seek care if mood symptoms become severe, persistent, or disrupt safety/function.',
    relatedArticleIds: ['topic_pmdd'],
  },
  sleep_debt: {
    id: 'sleep_debt',
    name: 'Sleep-related symptom amplification',
    summary: 'Your pattern is consistent with symptoms that can intensify after poor or fragmented sleep.',
    evidenceTier: 'High',
    redFlagRelated: false,
    whatToTrack: 'Track sleep quality, wake times, and next-day focus for 3-7 days.',
    seekCareWhen: 'Seek care if sleep disruption persists for multiple weeks despite routine changes.',
    relatedArticleIds: ['topic_sleep_focus'],
  },
  stress_load: {
    id: 'stress_load',
    name: 'High stress load pattern',
    summary: 'Your responses point to stress load as a likely contributor to current symptoms.',
    evidenceTier: 'Medium',
    redFlagRelated: false,
    whatToTrack: 'Track stress intensity, triggers, and recovery windows daily for one week.',
    seekCareWhen: 'Seek care if anxiety or overwhelm is persistent or significantly affects daily function.',
    relatedArticleIds: ['topic_sleep_focus'],
  },
  thyroid_pattern: {
    id: 'thyroid_pattern',
    name: 'Possible thyroid-related overlap',
    summary: 'Some selected factors can overlap with thyroid-related fatigue or concentration changes.',
    evidenceTier: 'High',
    redFlagRelated: false,
    whatToTrack: 'Track fatigue, mood, cycle timing, and temperature sensitivity before discussing labs.',
    seekCareWhen: 'Seek care if fatigue/cognitive symptoms persist and are not cycle- or sleep-linked.',
    relatedArticleIds: ['topic_thyroid_overlap'],
  },
  iron_pattern: {
    id: 'iron_pattern',
    name: 'Possible low-iron pattern',
    summary: 'Symptoms and cycle context may fit a low-iron pattern worth checking with a clinician.',
    evidenceTier: 'Medium',
    redFlagRelated: true,
    whatToTrack: 'Track energy dips, headaches, and bleeding heaviness for your next cycle.',
    seekCareWhen: 'Seek care if fatigue worsens, dizziness appears, or heavy bleeding continues.',
    relatedArticleIds: ['topic_thyroid_overlap'],
  },
}

export type EvaluationInput = {
  selectedSymptomIds: string[]
  answersByNodeId: Record<string, string[]>
}

export type CauseResult = LikelyCause & {
  score: number
  why: string
}

export type EvaluationResult = {
  rankedLikelyCauses: CauseResult[]
  safetyFlags: SafetyFlag[]
  contradictorySignals: string[]
  confidenceNote: string
}

function nextConfidence(score: number): ConfidenceBand {
  if (score >= 9) return 'high'
  if (score >= 5) return 'medium'
  return 'low'
}

function summarizeReason(causeId: CauseId, selectedSymptomIds: string[], answersByNodeId: Record<string, string[]>) {
  const reasons: string[] = []
  if (causeId === 'pmdd_window' && answersByNodeId.cycle_window?.includes('cycle_yes')) reasons.push('you reported premenstrual timing')
  if (causeId === 'sleep_debt' && answersByNodeId.sleep_quality?.includes('sleep_poor')) reasons.push('sleep quality was mostly rough')
  if (causeId === 'stress_load' && answersByNodeId.stress_level?.includes('stress_high')) reasons.push('stress was reported as high')
  if (causeId === 'thyroid_pattern' && selectedSymptomIds.includes('fatigue')) reasons.push('fatigue was one of your selected symptoms')
  if (causeId === 'iron_pattern' && (selectedSymptomIds.includes('fatigue') || answersByNodeId.red_flags?.includes('flag_heavy_bleeding'))) {
    reasons.push('fatigue or heavy-bleeding context was selected')
  }

  if (!reasons.length) return 'your symptom + answer pattern matched this cluster'
  return reasons.join('; ')
}

function detectContradictions(selectedSymptomIds: string[], answersByNodeId: Record<string, string[]>) {
  const contradictions: string[] = []
  const sleepGood = answersByNodeId.sleep_quality?.includes('sleep_good')
  const sleepIssuesSelected = selectedSymptomIds.includes('sleep_issues')
  if (sleepGood && sleepIssuesSelected) {
    contradictions.push('You selected sleep issues but also reported mostly solid sleep this week.')
  }

  const frequent = answersByNodeId.frequency?.includes('freq_most_days')
  const occasional = answersByNodeId.frequency?.includes('freq_occasional')
  if (frequent && occasional) {
    contradictions.push('Frequency answers include both occasional and most-days patterns.')
  }

  return contradictions
}

export function evaluateSymptomPath(input: EvaluationInput): EvaluationResult {
  const scoreMap: Record<CauseId, number> = {
    pmdd_window: 0,
    sleep_debt: 0,
    stress_load: 0,
    thyroid_pattern: 0,
    iron_pattern: 0,
  }

  input.selectedSymptomIds.forEach((symptomId) => {
    const base = symptomBaseScore[symptomId]
    if (!base) return
      ; (Object.keys(base) as CauseId[]).forEach((causeId) => {
        scoreMap[causeId] += base[causeId] ?? 0
      })
  })

  const flaggedIds = new Set<string>()
  treeNodes.forEach((node) => {
    const selectedOptions = input.answersByNodeId[node.id] ?? []
    selectedOptions.forEach((optionId) => {
      const option = node.options.find((candidate) => candidate.id === optionId)
      if (!option) return
      if (option.scoreDelta) {
        ; (Object.keys(option.scoreDelta) as CauseId[]).forEach((causeId) => {
          scoreMap[causeId] += option.scoreDelta?.[causeId] ?? 0
        })
      }
      option.safetyFlagIds?.forEach((flagId) => flaggedIds.add(flagId))
    })
  })

  const rankedLikelyCauses = (Object.keys(scoreMap) as CauseId[])
    .map((causeId) => ({
      ...causeTemplates[causeId],
      score: scoreMap[causeId],
      confidenceBand: nextConfidence(scoreMap[causeId]),
      why: summarizeReason(causeId, input.selectedSymptomIds, input.answersByNodeId),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const contradictorySignals = detectContradictions(input.selectedSymptomIds, input.answersByNodeId)
  const hasTie = rankedLikelyCauses.length > 1 && rankedLikelyCauses[0].score - rankedLikelyCauses[1].score <= 1

  const confidenceNote = contradictorySignals.length
    ? 'Some answers point in different directions, so treat these as possibilities to discuss with a clinician.'
    : hasTie
      ? 'Multiple patterns scored similarly. Track symptoms for another 3-7 days to sharpen the signal.'
      : 'These are educational likely-cause patterns, not diagnoses.'

  return {
    rankedLikelyCauses,
    safetyFlags: safetyFlags.filter((flag) => flaggedIds.has(flag.id)),
    contradictorySignals,
    confidenceNote,
  }
}

export function getTopicById(topicId: string): Topic | undefined {
  return topics.find((topic) => topic.id === topicId)
}

export function getLearnTopics(): Topic[] {
  return topics
}

export function getClaimsByIds(claimIds: string[]): Claim[] {
  return claimIds
    .map((claimId) => claims.find((claim) => claim.id === claimId))
    .filter((claim): claim is Claim => Boolean(claim))
}

export function getCitationsForClaim(claimId: string): Citation[] {
  return citations.filter((citation) => citation.claimIds.includes(claimId))
}

export function getTopCitedTopics() {
  return topics
    .map((topic) => {
      const topicClaims = getClaimsByIds(topic.claimIds)
      const citationIds = new Set<string>()
      topicClaims.forEach((claim) => claim.citationIds.forEach((citationId) => citationIds.add(citationId)))
      return { topic, citationCount: citationIds.size }
    })
    .sort((a, b) => b.citationCount - a.citationCount)
}

export function getSourceFreshnessWarnings(referenceYear = new Date().getFullYear()) {
  return citations
    .filter((citation) => referenceYear - citation.year > SOURCE_FRESHNESS_YEARS)
    .map((citation) => ({
      citationId: citation.id,
      message: `${citation.sourceOrg} (${citation.year}) is older than ${SOURCE_FRESHNESS_YEARS} years and should be reviewed.`,
    }))
}

export function getTreeNode(nodeId: string) {
  return treeNodes.find((node) => node.id === nodeId)
}

export function getNextNodeId(nodeId: string, selectedOptionIds: string[]) {
  const node = getTreeNode(nodeId)
  if (!node) return undefined
  for (const selectedOptionId of selectedOptionIds) {
    const rule = node.nextNodeRules.find((candidate) => candidate.optionId === selectedOptionId)
    if (rule?.nextNodeId) return rule.nextNodeId
    const option = node.options.find((candidate) => candidate.id === selectedOptionId)
    if (option?.nextNodeId) return option.nextNodeId
  }
  return undefined
}

export function getSuggestedEntrySymptoms() {
  return symptoms.slice(0, 4)
}

export function hasDiagnosticPhrasing(value: string) {
  const lowered = value.toLowerCase()
  return lowered.includes('you have') || lowered.includes('diagnosed with')
}
