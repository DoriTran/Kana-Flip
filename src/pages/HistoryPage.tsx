import { BookOpenCheck, Clock3, RotateCcw, Shuffle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { SettingsDialog } from '../components/SettingsDialog'
import { useKanaStore } from '../stores/kanaStore'
import type { StudySession } from '../types/kana'
import { sessionAddons } from '../utils/session'
import { formatTime, sessionSummary } from '../utils/stats'

const sourceLabel = (source: string) => source === 'addons' ? 'Add-ons' : source.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join(' ')

function formatSessionDate(timestamp: number) {
  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, '0')
  const hour = date.getHours()
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}. ${pad(hour % 12 || 12)}:${pad(date.getMinutes())} ${hour < 12 ? 'AM' : 'PM'}`
}

function sessionTitle(session: StudySession) {
  const base = session.type === 'review' ? 'Review · ' + sourceLabel(session.source) : sourceLabel(session.source)
  if (session.type !== 'study') return base
  const { includeVoiced, includeYoon } = sessionAddons(session)
  const addons = [includeVoiced && 'Voiced', includeYoon && 'Yōon'].filter(Boolean).join(' + ')
  if (session.source === 'addons') return addons || base
  return addons ? base + ' + ' + addons : base
}

function sessionKana(session: StudySession) {
  if (session.source === 'addons') {
    const { includeVoiced, includeYoon } = sessionAddons(session)
    return includeVoiced && includeYoon ? 'じゃ' : includeVoiced ? 'が' : 'ゃ'
  }
  return session.source === 'both' ? 'あア' : session.source === 'katakana' ? 'ア' : session.source === 'hiragana' ? 'あ' : null
}

export function HistoryPage() {
  const nav = useNavigate()
  const store = useKanaStore()
  const { sessions } = store
  const [settings, setSettings] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const studyCount = sessions.filter(session => session.type === 'study').length

  return <Layout onSettings={() => setSettings(true)}>
    <main className='history-page'>
      <section className='paper-card history'>
        <div className='section-heading between'>
          <div><h1>Recent Studies</h1><p>Your gentle learning rhythm</p></div>
          {sessions.length > 0 && <span>{studyCount} study sessions</span>}
        </div>
        {sessions.length === 0
          ? <div className='empty-history'><Clock3 /><p>Your completed sessions will bloom here.</p></div>
          : sessions.map(session => {
            const summary = sessionSummary(session)
            const kana = sessionKana(session)
            return <article key={session.id} className={session.type === 'review' ? 'review-row' : ''}>
              <span className={'history-kana' + (session.source === 'addons' ? ' addon-kana' : '') + (kana && kana.length > 1 ? ' both-kana' : '')}>{kana ?? <BookOpenCheck aria-label='Review' />}</span>
              <div>
                <b className='session-title-row'>
                  <span>{sessionTitle(session)}</span>
                  {session.reviewMistakesAtEnd && <RotateCcw aria-label='Review mistakes at end' />}
                  {session.shuffled && <Shuffle aria-label='Shuffled' />}
                  {session.timerMs != null && <Clock3 aria-label='Timer on' />}
                </b>
                <small>{formatSessionDate(session.finishedAt)}</small>
              </div>
              {session.type === 'study'
                ? <><strong>{summary.correct} / {summary.total}</strong><span>{Math.round(summary.accuracy)}%</span><span>{summary.wrong} mistakes</span><span>{formatTime(summary.averageMs)} avg</span></>
                : <span className='review-count'>{summary.total} cards</span>}
              <div className='history-actions'>
                <button className='history-review' onClick={() => nav('/review/' + session.id)} aria-label={'Review ' + session.source + ' lesson'}><BookOpenCheck /> Review</button>
                <button className='history-delete' onClick={() => setDeleting(session.id)} aria-label={'Delete ' + session.source + ' record'}><Trash2 /></button>
              </div>
            </article>
          })}
      </section>
    </main>
    {deleting && <div className='modal-backdrop'><div className='dialog mini' role='alertdialog' aria-modal='true'><h2>Delete this record?</h2><p>This removes only this completed session from your recent studies.</p><div className='dialog-actions'><button onClick={() => setDeleting(null)}>Keep it</button><button className='danger' onClick={() => { store.deleteSession(deleting); setDeleting(null) }}>Delete</button></div></div></div>}
    {settings && <SettingsDialog onClose={() => setSettings(false)} />}
  </Layout>
}
