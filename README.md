# Այլ կերպ (Ayl K'erp)

Ծրագրավորողների բառախաղ՝ React + TypeScript + Vite, PWA, offline, առանց backend-ի։

## Գործարկում
```bash
npm install
npm run dev       # մշակման սերվեր
npm test          # unit թեստեր
npm run build     # production build -> dist/ (ներառյալ sw.js)
npm run preview   # production build-ի ստուգում
```

## Կառուցվածք
- `src/game/` — խաղի տրամաբանություն (առանց React-ի)
- `src/storage/` — LocalStorage
- `src/hooks/useGameTimer.ts` — timestamp-based ժամաչափ
- `public/words.json` — բառարան (795 տերմին)
- `sw-template.js` + `vite.config.ts` — build-ի ժամանակ գեներացվում է `dist/sw.js`

## Deploy (Cloudflare Pages)
Build command: `npm run build` · Output directory: `dist`
