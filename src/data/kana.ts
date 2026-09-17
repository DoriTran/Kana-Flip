import type { Alphabet, Kana, KanaVariant } from '../types/kana'

type KanaEntry = readonly [soundKey: string, romaji: string, hiragana: string, katakana: string, group: string, variant: KanaVariant]

const basic = [
  ['a','a','あ','ア','vowels','basic'],['i','i','い','イ','vowels','basic'],['u','u','う','ウ','vowels','basic'],['e','e','え','エ','vowels','basic'],['o','o','お','オ','vowels','basic'],
  ['ka','ka','か','カ','k','basic'],['ki','ki','き','キ','k','basic'],['ku','ku','く','ク','k','basic'],['ke','ke','け','ケ','k','basic'],['ko','ko','こ','コ','k','basic'],
  ['sa','sa','さ','サ','s','basic'],['shi','shi','し','シ','s','basic'],['su','su','す','ス','s','basic'],['se','se','せ','セ','s','basic'],['so','so','そ','ソ','s','basic'],
  ['ta','ta','た','タ','t','basic'],['chi','chi','ち','チ','t','basic'],['tsu','tsu','つ','ツ','t','basic'],['te','te','て','テ','t','basic'],['to','to','と','ト','t','basic'],
  ['na','na','な','ナ','n','basic'],['ni','ni','に','ニ','n','basic'],['nu','nu','ぬ','ヌ','n','basic'],['ne','ne','ね','ネ','n','basic'],['no','no','の','ノ','n','basic'],
  ['ha','ha','は','ハ','h','basic'],['hi','hi','ひ','ヒ','h','basic'],['fu','fu','ふ','フ','h','basic'],['he','he','へ','ヘ','h','basic'],['ho','ho','ほ','ホ','h','basic'],
  ['ma','ma','ま','マ','m','basic'],['mi','mi','み','ミ','m','basic'],['mu','mu','む','ム','m','basic'],['me','me','め','メ','m','basic'],['mo','mo','も','モ','m','basic'],
  ['ya','ya','や','ヤ','y','basic'],['yu','yu','ゆ','ユ','y','basic'],['yo','yo','よ','ヨ','y','basic'],
  ['ra','ra','ら','ラ','r','basic'],['ri','ri','り','リ','r','basic'],['ru','ru','る','ル','r','basic'],['re','re','れ','レ','r','basic'],['ro','ro','ろ','ロ','r','basic'],
  ['wa','wa','わ','ワ','w','basic'],['wo','wo','を','ヲ','w','basic'],['n-final','n','ん','ン','n-final','basic'],
] as const satisfies readonly KanaEntry[]

const voiced = [
  ['ga','ga','が','ガ','voiced-g','voiced'],['gi','gi','ぎ','ギ','voiced-g','voiced'],['gu','gu','ぐ','グ','voiced-g','voiced'],['ge','ge','げ','ゲ','voiced-g','voiced'],['go','go','ご','ゴ','voiced-g','voiced'],
  ['za','za','ざ','ザ','voiced-z','voiced'],['ji','ji','じ','ジ','voiced-z','voiced'],['zu','zu','ず','ズ','voiced-z','voiced'],['ze','ze','ぜ','ゼ','voiced-z','voiced'],['zo','zo','ぞ','ゾ','voiced-z','voiced'],
  ['da','da','だ','ダ','voiced-d','voiced'],['di','ji','ぢ','ヂ','voiced-d','voiced'],['du','zu','づ','ヅ','voiced-d','voiced'],['de','de','で','デ','voiced-d','voiced'],['do','do','ど','ド','voiced-d','voiced'],
  ['ba','ba','ば','バ','voiced-b','voiced'],['bi','bi','び','ビ','voiced-b','voiced'],['bu','bu','ぶ','ブ','voiced-b','voiced'],['be','be','べ','ベ','voiced-b','voiced'],['bo','bo','ぼ','ボ','voiced-b','voiced'],
  ['pa','pa','ぱ','パ','voiced-p','voiced'],['pi','pi','ぴ','ピ','voiced-p','voiced'],['pu','pu','ぷ','プ','voiced-p','voiced'],['pe','pe','ぺ','ペ','voiced-p','voiced'],['po','po','ぽ','ポ','voiced-p','voiced'],
] as const satisfies readonly KanaEntry[]

const yoon = [
  ['kya','kya','きゃ','キャ','yoon-k','yoon'],['kyu','kyu','きゅ','キュ','yoon-k','yoon'],['kyo','kyo','きょ','キョ','yoon-k','yoon'],
  ['sha','sha','しゃ','シャ','yoon-sh','yoon'],['shu','shu','しゅ','シュ','yoon-sh','yoon'],['sho','sho','しょ','ショ','yoon-sh','yoon'],
  ['cha','cha','ちゃ','チャ','yoon-ch','yoon'],['chu','chu','ちゅ','チュ','yoon-ch','yoon'],['cho','cho','ちょ','チョ','yoon-ch','yoon'],
  ['nya','nya','にゃ','ニャ','yoon-n','yoon'],['nyu','nyu','にゅ','ニュ','yoon-n','yoon'],['nyo','nyo','にょ','ニョ','yoon-n','yoon'],
  ['hya','hya','ひゃ','ヒャ','yoon-h','yoon'],['hyu','hyu','ひゅ','ヒュ','yoon-h','yoon'],['hyo','hyo','ひょ','ヒョ','yoon-h','yoon'],
  ['mya','mya','みゃ','ミャ','yoon-m','yoon'],['myu','myu','みゅ','ミュ','yoon-m','yoon'],['myo','myo','みょ','ミョ','yoon-m','yoon'],
  ['rya','rya','りゃ','リャ','yoon-r','yoon'],['ryu','ryu','りゅ','リュ','yoon-r','yoon'],['ryo','ryo','りょ','リョ','yoon-r','yoon'],
] as const satisfies readonly KanaEntry[]

const voicedYoon = [
  ['gya','gya','ぎゃ','ギャ','yoon-g','voiced-yoon'],['gyu','gyu','ぎゅ','ギュ','yoon-g','voiced-yoon'],['gyo','gyo','ぎょ','ギョ','yoon-g','voiced-yoon'],
  ['ja','ja','じゃ','ジャ','yoon-j','voiced-yoon'],['ju','ju','じゅ','ジュ','yoon-j','voiced-yoon'],['jo','jo','じょ','ジョ','yoon-j','voiced-yoon'],
  ['bya','bya','びゃ','ビャ','yoon-b','voiced-yoon'],['byu','byu','びゅ','ビュ','yoon-b','voiced-yoon'],['byo','byo','びょ','ビョ','yoon-b','voiced-yoon'],
  ['pya','pya','ぴゃ','ピャ','yoon-p','voiced-yoon'],['pyu','pyu','ぴゅ','ピュ','yoon-p','voiced-yoon'],['pyo','pyo','ぴょ','ピョ','yoon-p','voiced-yoon'],
] as const satisfies readonly KanaEntry[]

const entries: readonly KanaEntry[] = [...basic, ...voiced, ...yoon, ...voicedYoon]

const make = (alphabet: Alphabet, charIndex: 2 | 3): Kana[] =>
  entries.map(([soundKey, romaji, hira, kata, group, variant], order) => ({
    id: alphabet + '-' + soundKey,
    character: charIndex === 2 ? hira : kata,
    romaji,
    alphabet,
    group,
    soundKey,
    order,
    variant,
  }))

export const hiragana = make('hiragana', 2)
export const katakana = make('katakana', 3)
export const allKana = [...hiragana, ...katakana]
export const kanaById = Object.fromEntries(allKana.map(kana => [kana.id, kana])) as Record<string, Kana>