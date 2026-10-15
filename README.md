# Divya Saroja Chayanam: website

Plain HTML, CSS and JavaScript. No build step, nothing to install.

**The rule of thumb:** words live in the `content` folder as spreadsheets (CSV files). You edit those. Layout, colors, fonts and new kinds of sections are design changes, which go to Claude.

## What each file controls

| File in `content/` | What it controls | Columns |
|---|---|---|
| `site.csv` | Headline, intro lines, section headings, contact text, social links, email, palette, how many writing items show | `key`, `value` (change only the value column) |
| `about.csv` | The About paragraphs | `text` (one row per paragraph) |
| `bring.csv` | The "What I bring" blocks | `title`, `text` |
| `cases.csv` | The case study cards on the home page (and the order, and what "Next case study" points to) | `slug`, `company`, `title`, `blurb`, `result` |
| `case_pages.csv` | The full text of each case page | `case`, `kind`, `label`, `text` (see below) |
| `writing.csv` | Your writing list | `date`, `title`, `url`, `source`, `note`, `image` |
| `built.csv` | "Things I have built" | `name`, `text` |

## Editing in Excel or Google Sheets

1. Open the file. Do not rename or reorder the header row.
2. Edit the cells. One paragraph per row. Rows starting with `#` are notes and are ignored.
3. In text cells you can write `**bold**` and `[link text](https://address)`.
4. Save as **CSV UTF-8** (Excel: Save As, then "CSV UTF-8 (Comma delimited)"). Google Sheets: File, Download, CSV.
5. Format the `date` column as text and use `YYYY-MM-DD` (for example 2026-11-03). Otherwise Excel may rewrite it.
6. Upload to GitHub: open the `content` folder, choose Add file, Upload files, drop the CSV, commit. A file with the same name replaces the old one. The site updates within a minute or two.

Leave a section empty (just the header row) and it disappears from the page.

## Case pages (`case_pages.csv`)

Each row has a `case` (the slug) and a `kind`:

- `fact`: a line in the facts strip. `label` = Role, Period and so on; `text` = the value.
- `section`: starts a new section. `text` = the heading.
- `p`: a paragraph. `li`: a bullet (consecutive bullets form one list). `note`: a small grey note.
- `diagram-eco`: a hub diagram. `label` = center text (use `|` for a line break), `text` = caption. The `node` rows right after it are the labels around the hub.
- `diagram-hubs`: the warehouse vs hubs picture. `label` = `left caption|right caption`, `text` = caption.

Rows appear on the page in the order they are in the file.

## Add a fourth case study

1. Duplicate `litefarm.html`, name it after the new slug (for example `newcase.html`) and change `data-case="litefarm"` to `data-case="newcase"`.
2. Add a row in `cases.csv` with that slug.
3. Add its rows in `case_pages.csv`.
4. Optional: add `images/newcase.jpg` for the home thumbnail. (Without a diagram or image the card simply has no thumbnail.)

## Add a piece of writing

Add a row to `writing.csv`. The site shows the most recent items, newest first (the number is `max_writing_items` in `site.csv`). To feature an older piece, give it a newer date. To remove one, delete its row.

## Photos and illustrations

- `photo.jpg` in the top folder: shows beside About. Portrait, at least 600 px wide. Delete it to remove.
- `images/<slug>.jpg` or `.png` (`tata-neu`, `locus`, `litefarm`): replaces that case thumbnail.
- `image` column in `writing.csv`: a file name from the `images` folder.
- About 800 by 600 px, under 300 KB.

## Important notes

- The text loads when the page opens, so the site must be viewed from a web address. Double-clicking `index.html` on your computer will show a "content did not load" message. Cloudflare preview links work.
- Because the text is filled in by JavaScript, search engines see less of it than on a pre-built page. Google generally handles this, but if search visibility becomes a priority, ask Claude about a build step.
- The share-preview text for the home page (what shows when the link is pasted in a chat) is in the `<head>` of `index.html`, not in the CSVs.
- If a CSV has a typo that breaks quotes, a section may look odd. Re-save from a spreadsheet app rather than a text editor.

## Publish it (free)

Option A, Cloudflare Pages (recommended; gives a private preview link for every draft change):
1. Create a Cloudflare account, choose Workers & Pages, then Pages, then Connect to Git.
2. Pick this repository. Leave the build command empty and set the output directory to `/`.
3. Under Custom domains, add `divyachayanam.com` and follow the DNS steps.

Option B, GitHub Pages: Settings, then Pages, choose the `main` branch and the root folder, then add your custom domain.

## Files

- `index.html` and `tata-neu.html`, `locus.html`, `litefarm.html`: page skeletons
- `content/`: all the words
- `style.css`: colors and typography
- `app.js`: reads the CSVs and builds the pages
