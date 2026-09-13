import type { Alphabet, Kana } from '../types/kana'

const sounds = [
  ['a','あ','ア','vowels'],['i','い','イ','vowels'],['u','う','ウ','vowels'],['e','え','エ','vowels'],['o','お','オ','vowels'],
  ['ka','か','カ','k'],['ki','き','キ','k'],['ku','く','ク','k'],['ke','け','ケ','k'],['ko','こ','コ','k'],
  ['sa','さ','サ','s'],['shi','し','シ','s'],['su','す','ス','s'],['se','せ','セ','s'],['so','そ','ソ','s'],
  ['ta','た','タ','t'],['chi','ち','チ','t'],['tsu','つ','ツ','t'],['te','て','テ','t'],['to','と','ト','t'],
  ['na','な','ナ','n'],['ni','に','ニ','n'],['nu','ぬ','ヌ','n'],['ne','ね','ネ','n'],['no','の','ノ','n'],
  ['ha','は','ハ','h'],['hi','ひ','ヒ','h'],['fu','ふ','フ','h'],['he','へ','ヘ','h'],['ho','ほ','ホ','h'],
  ['ma','ま','マ','m'],['mi','み','ミ','m'],['mu','む','ム','m'],['me','め','メ','m'],['mo','も','モ','m'],
  ['ya','や','ヤ','y'],['yu','ゆ','ユ','y'],['yo','よ','ヨ','y'],
  ['ra','ら','ラ','r'],['ri','り','リ','r'],['ru','る','ル','r'],['re','れ','レ','r'],['ro','ろ','ロ','r'],
  ['wa','わ','ワ','w'],['wo','を','ヲ','w'],['n','ん','ン','n-final'],
] as const

const make = (alphabet: Alphabet, charIndex: 1 | 2): Kana[] => sounds.map(([romaji, hira, kata, group], order) => ({ id: `${alphabet}-${romaji}`, character: charIndex === 1 ? hira : kata, romaji, alphabet, group, soundKey: romaji, order }))
export const hiragana = make('hiragana', 1)
export const katakana = make('katakana', 2)
export const allKana = [...hiragana, ...katakana]
export const kanaById = Object.fromEntries(allKana.map(kana => [kana.id, kana])) as Record<string, Kana>
