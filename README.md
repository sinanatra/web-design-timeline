# The disappearance of Web Design

This graph traces the evolution of the term "[Web Design](https://books.google.com/ngrams/graph?content=Web+Design&year_start=1990&year_end=2019&corpus=en-2019&smoothing=3)" in the literature from 1990 to the present day. The term has been in decline for years: the web itself has become more technical and standardised. Olia Lialina has criticised the idea underlying this change: that the [less one thinks about code](https://contemporary-home-computing.org/turing-complete-user/#:~:text=The%20less%20you%20think%20about%20source%20code%2C%20scripts%2C%20links%20and%20the%20web%20itself%2C%20the%20more%20creative%20you%20are%20as%20a%20web%20designer.), the more "creative" one is.

The personalised, handcrafted pages of the early years of the web have therefore been gradually replaced by predefined templates. Nevertheless, in recent years, alternative micro-resistance movements have been re-evaluating the web in a simple, personal, intimate way.

<img width="1431" height="549" alt="image" src="https://github.com/user-attachments/assets/15d330bc-888b-42ca-9db9-94b302c1d38c" />

## Setup

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
