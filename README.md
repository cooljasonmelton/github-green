# github-green

This repository makes one commit to GitHub every day.

A scheduled GitHub Action updates the README with unrelated daily items. This content is secondary.

The update can use fallback data, skip a section, or reuse a safe previous
value when a source is unavailable.

>My current employer uses Bitbucket so even though I'm out here coding my ass off, I no longer have a beautiful green contribution chart. I'm hacking it by automating one daily commit.

See [automation and content-health notes](#automation-and-content-health-notes) below.

<!-- DAILY_CONTENT_START -->

## Today — 2026-11-25

### Photo
![The Wrede passage (Finnish: Wreden pasaasi. Swedish: Wredes passage; also known as the "Old merchant alley", Finnish: Vanha kauppakuja, or the "Grandma tunnel", Finnish: Mummotunneli) is an entity formed by two stone buildings in Kluuvi, Helsinki, Finland](https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Wredes_passage_November_2025_01.jpg/960px-Wredes_passage_November_2025_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail)

*The Wrede passage (Finnish: Wreden pasaasi. Swedish: Wredes passage; also known as the "Old merchant alley", Finnish: Vanha kauppakuja, or the "Grandma tunnel", Finnish: Mummotunneli) is an entity formed by two stone buildings in Kluuvi, Helsinki, Finland* — ArildV. [Source](https://commons.wikimedia.org/wiki/File:Wredes_passage_November_2025_01.jpg) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)

### Word
**curious** — *adjective*

Eager to know or learn something.

A curious question often reveals the useful edge case.

### Quote
> All that we see or seem is but a dream within a dream.

— Edgar Allan Poe, *A Dream Within a Dream*

### On This Day
Coup of 25 November 1975, a failed military coup d'état by Portuguese far-left activists seeking to hijack the  Portuguese transition to democracy to establish a communist regime.

[Source](https://en.wikipedia.org/wiki/Coup_of_25_November_1975)

### Born Today
**Carl Benz** (1844) — German designer and engineer (1844–1929)

[Source](https://en.wikipedia.org/wiki/Carl_Benz)

### Pop Culture
An earthquake hits the Mediterranean destroying Beirut and Damascus and killing 30,000–40,000.

[Source](https://en.wikipedia.org/wiki/1759_Near_East_earthquakes)

### Miscellaneous
**literature:** The Gutenberg Bible was printed in Mainz around 1455.

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
