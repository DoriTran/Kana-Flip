import { copyFileSync } from 'node:fs'

const dist = new URL('../dist/', import.meta.url)
copyFileSync(new URL('kanaflip/index.html', dist), new URL('index.html', dist))
