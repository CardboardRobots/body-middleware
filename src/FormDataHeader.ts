export class FormDataHeader {
    static create(headerText: string) {
        const header = new FormDataHeader();

        const rows = headerText.split('\r\n');
        if (rows.length) {
            rows.forEach((row) => {
                const parts = row.split(': ');
                if (parts.length === 2) {
                    header.rawHeaders[parts[0]] = parts[1];
                }
            });
        }
        return header;
    }

    rawHeaders: Record<string, string> = {};

    get contentType() {
        return this.rawHeaders['Content-Type'];
    }

    get contentDisposition() {
        const row = this.rawHeaders['Content-Disposition'];
        if (row) {
            const parts = row.split('; ');
            const name = parts[0];
            const hash: Record<string, any> = {};
            if (parts.length > 1) {
                parts.shift();

                // Header Data
                parts.forEach((part) => {
                    const match = part.trim().match(/(.*)="(.*)"/);
                    if (match && match.length === 3) {
                        hash[match[1]] = match[2];
                    }
                });
            }
            return {
                name,
                hash,
            };
        } else {
            return undefined;
        }
    }
}
