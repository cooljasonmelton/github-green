# github-green contributor guide

## Working order

- Work on one numbered roadmap prompt at a time. Do not implement a later
  prompt opportunistically.
- Inspect the existing implementation and preserve unrelated user work before
  editing.
- Keep the current task's scope, changed areas, verification results,
  limitations, and consequential decisions visible in the final handoff.

## Engineering guardrails

- Use small Node.js ES modules and built-in APIs where practical. Keep
  dependencies and abstractions to the minimum the active prompt requires.
- Treat content generation and the Git commit heartbeat as separate concerns.
  A category failure must be isolated from the other categories and must not
  prevent the eventual commit path.
- Keep deterministic parsing and selection as small functions with explicit
  date/time inputs. Validate content at its boundary and handle unavailable or
  invalid data deliberately.
- Use focused tests for meaningful behavior: observe a test fail for the
  intended reason, add the smallest implementation, then re-run the relevant
  suite. Tests must not require live network access.
- Do not add paid services, databases, frameworks, or external accounts unless
  an active prompt explicitly requires them. Do not invent public facts,
  credits, or attributions.
- Keep the README candid: this repository exists to create a daily GitHub
  contribution; its daily content is secondary.

## Repository conventions

- A day is interpreted in `America/Chicago` unless an active prompt requires a
  different rule. GitHub Actions cron must account for its UTC schedule and
  daylight-saving changes.
- Never commit, push, or stage changes unless the user explicitly asks.
