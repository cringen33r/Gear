```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadCsv, saveFile } from './download';

describe('saveFile', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    it('creates a blob URL and downloads the file', () => {
        const file = new Blob(['content'], { type: 'text/plain' });
        const objectUrl = 'blob:test-url';

        vi.spyOn(URL, 'createObjectURL').mockReturnValue(objectUrl);
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        const click = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => {});

        vi.useFakeTimers();

        saveFile(file, 'test.txt');

        expect(URL.createObjectURL).toHaveBeenCalledOnce();
        expect(URL.createObjectURL).toHaveBeenCalledWith(file);

        expect(click).toHaveBeenCalledOnce();
        expect(document.querySelector('a')).toBeNull();
    });

    it('configures the download link correctly', () => {
        const file = new Blob(['content']);
        const objectUrl = 'blob:test-url';

        vi.spyOn(URL, 'createObjectURL').mockReturnValue(objectUrl);
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
        vi.spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => {});

        const originalCreateElement = document.createElement.bind(document);
        const createElement = vi
            .spyOn(document, 'createElement')
            .mockImplementation((tagName, options) =>
                originalCreateElement(tagName, options),
            );

        saveFile(file, 'report.pdf');

        const anchor = createElement.mock.results
            .map(({ value }) => value)
            .find(
                (element): element is HTMLAnchorElement =>
                    element instanceof HTMLAnchorElement,
            );

        expect(anchor).toBeDefined();
        expect(anchor).toMatchObject({
            download: 'report.pdf',
        });
        expect(anchor!.href).toBe(objectUrl);
        expect(anchor!.style.display).toBe('none');
    });

    it('revokes the object URL after 1000 ms', () => {
        const file = new Blob(['content']);
        const objectUrl = 'blob:test-url';

        vi.spyOn(URL, 'createObjectURL').mockReturnValue(objectUrl);

        const revokeObjectURL = vi
            .spyOn(URL, 'revokeObjectURL')
            .mockImplementation(() => {});

        vi.spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => {});

        vi.useFakeTimers();

        saveFile(file, 'test.txt');

        expect(revokeObjectURL).not.toHaveBeenCalled();

        vi.advanceTimersByTime(999);
        expect(revokeObjectURL).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(revokeObjectURL).toHaveBeenCalledOnce();
        expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
    });

    it('removes the link and still schedules URL cleanup when click fails', () => {
        const file = new Blob(['content']);
        const objectUrl = 'blob:test-url';

        vi.spyOn(URL, 'createObjectURL').mockReturnValue(objectUrl);

        const revokeObjectURL = vi
            .spyOn(URL, 'revokeObjectURL')
            .mockImplementation(() => {});

        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
            throw new Error('click failed');
        });

        vi.useFakeTimers();

        expect(() => saveFile(file, 'test.txt')).toThrow('click failed');

        expect(document.querySelector('a')).toBeNull();

        vi.advanceTimersByTime(1000);

        expect(revokeObjectURL).toHaveBeenCalledOnce();
        expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
    });
});

describe('downloadCsv', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('downloads CSV content using a data URL', () => {
        const fileName = 'report.csv';
        const fileContent = 'name,age\nJohn,20';

        const click = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => {});

        const originalCreateElement = document.createElement.bind(document);
        const createElement = vi
            .spyOn(document, 'createElement')
            .mockImplementation((tagName, options) =>
                originalCreateElement(tagName, options),
            );

        downloadCsv(fileName, fileContent);

        const anchor = createElement.mock.results
            .map(({ value }) => value)
            .find(
                (element): element is HTMLAnchorElement =>
                    element instanceof HTMLAnchorElement,
            );

        expect(anchor).toBeDefined();
        expect(click).toHaveBeenCalledOnce();

        expect(anchor!.href).toBe(
            `data:text/csv;charset=utf-8,%EF%BB%BF${encodeURI(fileContent)}`,
        );
        expect(anchor!.download).toBe(fileName);
        expect(anchor!.target).toBe('_blank');
    });

    it('includes UTF-8 BOM in the generated CSV URL', () => {
        const fileContent = 'колонка1,колонка2';

        vi.spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => {});

        const originalCreateElement = document.createElement.bind(document);
        const createElement = vi
            .spyOn(document, 'createElement')
            .mockImplementation((tagName, options) =>
                originalCreateElement(tagName, options),
            );

        downloadCsv('test.csv', fileContent);

        const anchor = createElement.mock.results
            .map(({ value }) => value)
            .find(
                (element): element is HTMLAnchorElement =>
                    element instanceof HTMLAnchorElement,
            );

        expect(anchor).toBeDefined();
        expect(anchor!.href).toContain('%EF%BB%BF');
        expect(anchor!.href).toContain(encodeURI(fileContent));
    });

    it('removes the link after the download is triggered', () => {
        vi.spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => {});

        downloadCsv('test.csv', 'a,b');

        expect(document.querySelector('a')).toBeNull();
    });

    it('removes the link when click fails', () => {
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
            throw new Error('click failed');
        });

        expect(() => downloadCsv('test.csv', 'a,b')).toThrow('click failed');
        expect(document.querySelector('a')).toBeNull();
    });
});
```