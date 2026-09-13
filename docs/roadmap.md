# Project roadmap

The project is delivered one prompt at a time. Each prompt must be verified
before beginning the next one.

1. **Scaffold the repository** — Node.js ES modules, normalized daily-entry
   model, generator entry point, and baseline tests.
2. **Build the offline content system** — deterministic checked-in vocabulary,
   quote, and miscellaneous datasets with emergency fallbacks.
3. **Research and implement live sources** — normalized, safe Wikimedia
   providers for historical events, birthdays, and a daily Commons image.
4. **Selection logic** — deterministic, testable selection of history,
   birthday, and pop-culture candidates.
5. **README generator and archive** — marker-safe README output, date archive,
   and machine-readable run status.
6. **Reliability layer** — per-section fallbacks, prior-value reuse where
   appropriate, and an emergency heartbeat updater.
7. **GitHub Actions workflow** — scheduled, Chicago-date-aware daily commit
   workflow with manual dispatch and a resilient push path.
7a. **Fallback-photo rendering fix** — render valid attributed photos supplied
    by the `fallback` or `previous` reliability paths, not only `live` photos;
    add a regression test using the 2001-09-11 failure shape.
7b. **Content health alerts** — alert on persistent provider outages without
   risking the daily commit path.
8. **Pinned-repository README review** — concise, candid landing-page copy and
   readable generated content.
9. **Reliability audit** — trace and test every repository-controlled failure
   that could prevent the daily contribution.

## Prompt 007b — Content health alerts

Add this after Prompt 007, since it depends on the normal generator's status
data and the scheduled workflow.

Track each live provider independently in `data/provider-health.json`. A
provider failure means a request or response-validation failure; it does not
mean that a selector found no suitable candidate. Increment the consecutive
failure count at most once per `America/Chicago` date, reset it after a
successful provider response, and retain enough state to avoid duplicate
alerts.

When a provider reaches ten consecutive failed dates, the workflow should open
or reopen one GitHub issue describing the provider, streak, latest failure date,
and manual recovery check. Do not create a new issue every day. The issue step
must be non-blocking: a GitHub API, permissions, or issue-tracking failure must
not affect content generation, the heartbeat update, or the commit/push path.

Grant the alert job only the permissions it needs: `contents: write` for the
normal status/heartbeat commit and `issues: write` for the alert issue. Use the
repository's GitHub notifications for delivery rather than adding SMTP or an
external email service. Document that the owner must enable their preferred
GitHub email or web notifications.

Tests must cover independent counters, one increment per date, reset on
success, the ten-day threshold, duplicate-alert suppression, and alert-step
failure isolation.
