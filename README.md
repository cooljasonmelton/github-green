# github-green

This repository makes one commit to GitHub every day.

A scheduled GitHub Action updates the README with unrelated daily items. This content is secondary.

The update can use fallback data, skip a section, or reuse a safe previous
value when a source is unavailable.

>My current employer uses Bitbucket so even though I'm out here coding my ass off, I no longer have a beautiful green contribution chart. I'm hacking it by automating one daily commit.

See [automation and content-health notes](#automation-and-content-health-notes) below.

<!-- DAILY_CONTENT_START -->

## Today — 2026-11-20

### Photo
![Trail from Andiast to Breil-Brigels. Bad weather in the Breil-Brigels region, but it has now dried up.](https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Andiast-Breil-Brigels._24-09-2025._%28d.j.b.%29_08.jpg/960px-Andiast-Breil-Brigels._24-09-2025._%28d.j.b.%29_08.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail)

*Trail from Andiast to Breil-Brigels. Bad weather in the Breil-Brigels region, but it has now dried up.* — Dominicus Johannes Bergsma.. [Source](https://commons.wikimedia.org/wiki/File:Andiast-Breil-Brigels._24-09-2025._(d.j.b.)_08.jpg) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)

### Word
**tenacious** — *adjective*

Tending to keep a firm hold of something; persistent.

The tenacious researcher checked each source twice.

### Quote
> To thine own self be true.

— William Shakespeare, *Hamlet, Act 1, Scene 3*

### On This Day
Nuremberg trials: Trials against 24 Nazi war criminals start at the Palace of Justice at Nuremberg.

[Source](https://en.wikipedia.org/wiki/Nuremberg_trials)

### Born Today
**Helma Sanders-Brahms** (1940) — German film director, screenwriter, producer and actress (1940–2014)

[Source](https://en.wikipedia.org/wiki/Helma_Sanders-Brahms)

### Pop Culture
An 80-ton sperm whale attacks and sinks the Essex (a whaling ship from Nantucket, Massachusetts) 3,200 kilometres (2,000 mi) from the western coast of South America. (Herman Melville's 1851 novel Moby-Dick was in part inspired by this incident.)

[Source](https://en.wikipedia.org/wiki/Sperm_whale)

### Miscellaneous
**animals:** Octopuses have three hearts.

<!-- DAILY_CONTENT_END -->

## Automation and content health notes

### Daily automation

The workflow aims to run at 7:17 AM in `America/Chicago` but GitHub can delay or skip scheduled runs, so that time is not guaranteed. It can also be run
manually from the Actions tab.  It needs repository variables `COMMIT_NAME` and
`COMMIT_EMAIL`; the email must be associated with the owner's GitHub account.

If a scheduled run has not recorded that Chicago date, two later attempts run.
Once the date is recorded, later attempts exit without another commit.

The workflow retries a rejected push once after rebasing. It cannot guarantee a
contribution during a GitHub outage, missing write permission, bad repository
authentication, disabled Actions, or an unresolved push conflict.

### Content health alerts

After ten consecutive failed Chicago dates for a live provider, the workflow
opens or reopens one GitHub issue. GitHub email or web notifications can deliver
that alert outside the repository.

External content sources and attribution requirements are documented in
[docs/sources.md](docs/sources.md).

The delivery order is in [docs/roadmap.md](docs/roadmap.md).
