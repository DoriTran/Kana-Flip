import { Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Layout } from '../components/Layout'
import { SettingsDialog } from '../components/SettingsDialog'
import { allKana } from '../data/kana'
import { useKanaStore } from '../stores/kanaStore'
import { formatTime, needsPracticeScore, recentWrongCount } from '../utils/stats'

type Tab = 'hiragana' | 'katakana' | 'both' | 'starred'
type Sort = 'default' | 'fastest' | 'slowest' | 'least' | 'most' | 'needs'

export function AlphabetPage() {
  const [tab, setTab] = useState<Tab>('hiragana')
  const [sort, setSort] = useState<Sort>('default')
  const [query, setQuery] = useState('')
  const [settings, setSettings] = useState(false)
  const { kanaProgress, sessions } = useKanaStore()

  const list = useMemo(() => {
    const filtered = allKana.filter(kana =>
      (tab === 'both' || (tab === 'starred' && kanaProgress[kana.id]?.starred) || kana.alphabet === tab) &&
      (kana.romaji.includes(query.toLowerCase()) || kana.character.includes(query)),
    )
    const best = (id: string) => kanaProgress[id]?.bestRecognitionMs ?? null

    return [...filtered].sort((a, b) => {
      if (sort === 'fastest') return (best(a.id) ?? Infinity) - (best(b.id) ?? Infinity)
      if (sort === 'slowest') return (best(b.id) ?? -1) - (best(a.id) ?? -1)
      if (sort === 'least') return recentWrongCount(sessions, a.id) - recentWrongCount(sessions, b.id)
      if (sort === 'most') return recentWrongCount(sessions, b.id) - recentWrongCount(sessions, a.id)
      if (sort === 'needs') return needsPracticeScore(b, sessions, best(b.id)) - needsPracticeScore(a, sessions, best(a.id))
      return a.order - b.order || (a.alphabet === 'hiragana' ? -1 : 1)
    })
  }, [tab, sort, query, kanaProgress, sessions])

  const showPairs = tab === 'both' && sort === 'default'

  return <Layout onSettings={() => setSettings(true)}>
    <main>
      <section className="alphabet-head"><h1>Alphabet</h1><p>Browse, star, and get to know every kana.</p></section>
      <div className="alphabet-toolbar">
        <div className="tabs">{(['hiragana', 'katakana', 'both', 'starred'] as Tab[]).map(value => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{value === 'starred' && <Star />}{value[0].toUpperCase() + value.slice(1)}</button>)}</div>
        <div className="search-sort">
          <label><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search kana..." /></label>
          <select value={sort} onChange={event => setSort(event.target.value as Sort)} aria-label="Sort kana">
            <option value="default">Alphabet</option><option value="fastest">Fastest first</option><option value="slowest">Slowest first</option><option value="least">Least mistakes</option><option value="most">Most mistakes</option><option value="needs">Needs Practice</option>
          </select>
        </div>
      </div>
      {list.length === 0
        ? <div className="paper-card alphabet-empty"><Star /><h2>No kana here yet</h2><p>Star a few kana to see them here.</p></div>
        : showPairs
          ? <div className="paired-grid">{[...new Set(list.map(kana => kana.soundKey))].map(sound => <section key={sound}><h2>{sound.toUpperCase()}</h2><div>{list.filter(kana => kana.soundKey === sound).map(kana => <KanaCard key={kana.id} id={kana.id} />)}</div></section>)}</div>
          : <div className="kana-grid">{list.map(kana => <KanaCard key={kana.id} id={kana.id} />)}</div>}
    </main>
    {settings && <SettingsDialog onClose={() => setSettings(false)} />}
  </Layout>
}

function KanaCard({ id }: { id: string }) {
  const kana = allKana.find(item => item.id === id)!
  const { kanaProgress, sessions, toggleStar } = useKanaStore()
  const progress = kanaProgress[id]
  return <article className="kana-card">
    <button className={`star-button ${progress?.starred ? 'starred' : ''}`} onClick={() => toggleStar(id)} aria-label={progress?.starred ? 'Unstar kana' : 'Star kana'}><Star /></button>
    <span className="kana-char">{kana.character}</span><b>{kana.romaji}</b>
    <div><span>Best<strong>{formatTime(progress?.bestRecognitionMs ?? null)}</strong></span><span>Last 10<strong className="wrong-stat">× {recentWrongCount(sessions, id)}</strong></span></div>
  </article>
}
