# raw/ — Source Material

Drop articles, research, interview notes, competitor analyses, brand guidelines, meeting notes and other external material here.

**Rules:**
- The agent reads this folder but never edits or deletes files here.
- You commit these files; the agent compiles them into the wiki (`../<domain>/`).
- Session captures from `/design-os:wiki-capture` land here as `capture-<timestamp>.md`.
- Compile one file: `/design-os:wiki-ingest wiki/raw/<file>`
- Compile everything pending: `/design-os:wiki-ingest --pending`
- Fetch a URL into raw/ and compile it: `/design-os:wiki-ingest <url>`

DesignOS planning artifacts in `product/` are **not** copied here. Compile them with `/design-os:wiki-ingest --product`.

Supported: `.md`, `.txt`, `.pdf` (text-extractable)
