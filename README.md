# Sentinel — Password Strength & Breach Auditor

A small, framework-free web app that scores password strength in real time and checks whether a password has appeared in a known data breach — **without ever sending the password anywhere.**

**[Live demo](https://github.com/rhizzyxvaici171-cloud/sentinel)** 

## What it does

- Scores a password's strength using a Shannon-entropy calculation based on character-set size and length
- Estimates a rough offline crack time
- Checks the password against [Have I Been Pwned](https://haveibeenpwned.com/API/v3#PwnedPasswords)'s breach database using the **k-anonymity** model
- Runs entirely client-side: no backend, no server, no database

## Why the breach check is private

Sending a raw password to any API — even a trustworthy one — is bad practice. This app never does that. Instead:

1. The password is hashed with SHA-1, in the browser, using the native Web Crypto API.
2. Only the **first 5 characters** of that 40-character hash are sent to the Have I Been Pwned API.
3. The API returns every breached hash suffix that starts with those 5 characters (typically several hundred).
4. The app checks locally whether the full hash is anywhere in that list.

The server only ever sees a 5-character prefix shared by hundreds of other hashes — it has no way to know which password (or hash) you actually checked. This is the same k-anonymity pattern used by production breach-monitoring tools, browser password managers, and services like 1Password's Watchtower.

## Tech stack

Plain HTML, CSS, and JavaScript. No build step, no dependencies, no package.json. The only network call is a single `fetch` to the Have I Been Pwned range API.

## Running it locally

Clone the repo and open `index.html` in a browser — that's it.

```bash
git clone https://github.com/rhizzyxvaici171-cloud/sentinel.git
cd sentinel
open index.html   # or just double-click it
```

## Deploying to GitHub Pages

1. Push this repo to GitHub (see commands below).
2. In the repo, go to **Settings → Pages**.
3. Under **Source**, select the `main` branch and `/ (root)` folder.
4. Save. Your app will be live at `https://rhizzyxvaici171-cloud.github.io/sentinel/` within a minute or two.

## Project structure

```
sentinel/
├── index.html     # markup
├── style.css      # visual design (design tokens at the top)
├── script.js      # entropy scoring + k-anonymity breach lookup
├── README.md
└── LICENSE
```

## Possible extensions

- Add a `zxcvbn`-style dictionary/pattern check for more realistic strength scoring
- Add a "generate a strong password" button
- Add dark/light theme toggle
- Turn the crack-time model into a configurable attacker-speed selector (offline GPU vs. online rate-limited)

## License

MIT — see [LICENSE](LICENSE).
