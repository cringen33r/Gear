# Playwright: testing Blob download via `<a>`

This example contains:

- a real `saveFile(fileName, blob)` implementation based on `<a download>`;
- a Node.js HTTP server with a `/blob` endpoint returning binary content;
- Playwright tests verifying the file name, file contents, successful download, and the request to `/blob`;
- Playwright configuration including the test server startup.

## Install

```bash
npm install
npx playwright install chromium
```

## Run

```bash
npm test
```

The test server is started automatically by `playwright.config.js`.

To start it manually:

```bash
npm start
```
