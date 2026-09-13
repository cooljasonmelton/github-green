# External sources and attribution

## Wikimedia daily feeds

The project uses the English Wikipedia REST feed endpoints hosted at
`en.wikipedia.org`:

- `feed/onthisday/events/MM/DD` supplies historical-event candidates.
- `feed/onthisday/births/MM/DD` supplies birthday candidates.
- `feed/featured/YYYY/MM/DD` supplies the daily featured image, which is
  sourced from Wikimedia Commons.

The event feed will also supply candidates for the later pop-culture selector;
it does not require another daily request. The providers make no live request
in tests, and selection is deliberately deferred to Prompt 004.

## Automated access

Each request sends a descriptive `User-Agent` identifying this repository and
uses a short timeout. The scheduled use is a small number of daily requests;
the client must respect HTTP status responses and any provider throttling.

## Reuse and attribution

Wikipedia text can have attribution and share-alike obligations. Generated
event and birthday output must retain its source-page link. Wikimedia Commons
media is licensed per file, not under one universal license. The photo provider
therefore retains its file-page URL, creator, credit, license name, and license
URL. The README renderer added in Prompt 005 must display the required photo
attribution and link to the source and license.
