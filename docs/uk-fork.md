# UK fork

This checkout is a private fork of
[uxdesignlab/job-search-terminal](https://github.com/uxdesignlab/job-search-terminal),
adapted for searching in the United Kingdom. The original is kept as the
`upstream` git remote; this fork's own repository is `origin`. Work happens on
the `uk` branch and `main` stays a clean copy of upstream, so
`git fetch upstream && git merge upstream/main` brings their changes in.

The licence (CC BY-NC 4.0) allows private, non-commercial changes with
attribution — keep `LICENSE` and `ATTRIBUTION.md`.

## What differs from upstream

| Area | Upstream | This fork | Where |
| --- | --- | --- | --- |
| Adzuna country | `us` | `gb`, via `ADZUNA_DEFAULT_COUNTRY` | `src/lib/scanner/aggregator-scanner.ts` |
| Adzuna `where` | whole saved address | first segment (the town); country-level entries mean "nationwide" | `adzunaWhereFor`, `buildAdzunaLanes` |
| Adzuna salary text | `$` | currency by country (`£` for `gb`) | `formatSalary` |
| Dice | runs on every scan | skipped unless `JST_ENABLE_DICE=1` | `src/lib/scanner/job-discovery.ts` |
| Browser-scan start URLs | indeed.com, glassdoor.com, monster.com | uk.indeed.com, glassdoor.co.uk, monster.co.uk | `CLAUDE.md`, `AGENTS.md` |
| Known board hosts | US boards | plus Reed, Totaljobs, CV-Library, Find a job, NHS Jobs, Civil Service Jobs, jobs.ac.uk, Technojobs, `.co.uk` Glassdoor/Monster | `liveness-checker.ts`, `company-domain.ts`, `job-table-helpers.ts` |
| Location picker | `city` before `town`; `state` before `county`; any match type | town before city; county before nation in the UK; places only; UK/Ireland ranked first | `src/lib/profile/location-suggestions.ts`, `src/app/api/locations/search/route.ts` |
| Brave / salary search country | `us` / "United States" | `gb` / "United Kingdom" | `email-posting-resolver.ts`, `compensation.ts` |

## How location matching works (UK)

A preferred location is saved as a full address and matched, word for word,
against the text a board prints. The saved label's parts become match words —
`Harrogate, North Yorkshire, United Kingdom` matches any posting containing
`harrogate` or `north yorkshire`, and a bare `United Kingdom` posting counts as
country-wide. The final country part is not itself a match word, so a UK
preference does not accept every UK job. The matcher is text-based and has no
notion of distance, so a neighbouring town in another county is not matched
until you add it as a second location.

Tests: `src/lib/__tests__/preference-fit-uk.test.ts` and
`location-suggestions.test.ts`.

## Not done yet

- **Commute radius.** Adzuna accepts a `distance` parameter, but a wider search
  imports neighbouring towns that the text matcher then rejects. It needs
  geographic matching first.
- **Reed API scanner** (free key) and browser-scan recipes for Find a job, NHS
  Jobs, Civil Service Jobs and the UK tech boards. They would be new sources in
  `src/lib/scanner/browser-board-sources.ts` plus scanner code.
- **UK company list** for the Greenhouse / Lever / Ashby scan
  (`config/portals.yml`).
- The Monster UK URL parameters (`recency`, `sort`) are carried over from the US
  site and have not been checked against monster.co.uk.
- Four test files fail on Windows with `EBUSY` while deleting a temporary SQLite
  file after each test (`contact-notes`, `evaluation-detail-carry`,
  `integration-metadata`, `review-queue-db`). The assertions pass; it is the
  cleanup that fails. Not caused by this fork's changes.
