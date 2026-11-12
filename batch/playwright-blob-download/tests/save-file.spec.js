import { test, expect } from '@playwright/test';

const expectedFileName = 'example.txt';
const expectedContent = 'Hello from the Blob server!\n';

test('downloads a Blob with the requested file name', async ({ page }) => {
  await page.goto('/');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe(expectedFileName);
  expect(await download.createReadStream()).toBeTruthy();
  expect(await download.path()).not.toBeNull();
  expect(await download.failure()).toBeNull();

  const downloadedFile = await download.path();
  const fs = await import('node:fs/promises');
  const actualContent = await fs.readFile(downloadedFile, 'utf8');

  expect(actualContent).toBe(expectedContent);
});

test('requests the Blob from the server before saving it', async ({ page }) => {
  let blobRequestSeen = false;

  page.on('request', (request) => {
    if (request.url().endsWith('/blob')) {
      blobRequestSeen = true;
    }
  });

  await page.goto('/');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  await downloadPromise;

  expect(blobRequestSeen).toBe(true);
});
