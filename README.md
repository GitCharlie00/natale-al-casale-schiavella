# Festa di Natale · Casale Schiavella

Sito statico (HTML, CSS, JS) pubblicato su GitHub Pages tramite una GitHub Action.

## Come funzionano le sorprese

- `_segreto/sorprese.json`: testi e date in chiaro. **Escluso da git**, resta solo sul tuo PC.
- `_segreto/password.txt`: la password admin. **Esclusa da git**.
- `data/sorprese.enc.json`: le sorprese cifrate (AES-GCM) con la password. Va su GitHub: senza password è illeggibile.
- `.github/workflows/pages.yml`: ogni notte alle 00:05 (ora italiana), e a ogni push, la Action decifra le sorprese con la password salvata nei secret di GitHub e pubblica **in chiaro solo quelle con la data già arrivata**. Le altre non esistono nel sito pubblico.

### Vista admin

Apri il sito con `?admin` in fondo all'indirizzo (es. `https://<utente>.github.io/festa-natale/?admin`), inserisci la password e vedi tutte le sorprese, anche quelle ancora coperte. Il browser se la ricorda finché non premi "Esci".

### Modificare testi o date

1. Modifica `_segreto/sorprese.json` (date `AAAA-MM-GG`, si aprono a mezzanotte ora italiana)
2. `node tools/encrypt.mjs`
3. Commit e push: la Action ripubblica il sito

Per cambiare password: modifica `_segreto/password.txt`, rilancia `node tools/encrypt.mjs` e aggiorna il secret `SURPRISES_KEY` su GitHub.

## Anteprima in locale

```
node tools/build.mjs
python -m http.server 8765
```

Poi apri http://localhost:8765. Per simulare un altro giorno: `NOW=2026-12-06 node tools/build.mjs` (in PowerShell: `$env:NOW="2026-12-06"; node tools/build.mjs`).

## Pubblicare su GitHub Pages

1. Crea un repo vuoto su https://github.com/new (es. `festa-natale`, pubblico, senza README)
2. Su GitHub, nel repo: Settings → Secrets and variables → Actions → New repository secret
   - Name: `SURPRISES_KEY`
   - Secret: il contenuto di `_segreto/password.txt`
3. Settings → Pages → Source: **GitHub Actions**
4. Dalla cartella del sito:
   ```
   git remote add origin https://github.com/<utente>/festa-natale.git
   git push -u origin main
   ```
5. Nella scheda Actions vedi la pubblicazione. Il sito sarà su `https://<utente>.github.io/festa-natale/`
