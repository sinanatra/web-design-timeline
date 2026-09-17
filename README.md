# The disappearance of Web Design

All branches, phases, and timeline items live in `data/timeline.md`, edit
that file and reload the page, no build step needed. See the table headers
in that file for the expected columns.

The blue line is real Google Ngrams data for "Web Design", loaded from
`data/ngrams.json`. To update that visit this URL in your browser:

   ```
   https://books.google.com/ngrams/json?content=Web+Design&year_start=1990&year_end=2027&corpus=en-2020&smoothing=3
   ```

1. Copy the `timeseries` array from the response.
2. Paste it into `data/ngrams.json`.
