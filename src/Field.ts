/* eslint-disable no-param-reassign */
import { Duplex } from 'stream';

import { FormDataHeader } from './FormDataHeader';
import { IFileHandler } from './IFileHandler';
import { IFileField } from './IFileField';

export class Field {
    header?: FormDataHeader;
    name?: string;
    fileName?: string;
    fileType?: string;
    fileStream: Duplex;
    data: (string | Buffer)[] = [];
    firstLine = false;
    stashedBuffer?: Buffer;
    fileHandler: IFileHandler;

    constructor(fileHandler: IFileHandler) {
        this.fileHandler = fileHandler;
        this.fileStream = new Duplex();
        this.fileStream._read = function () {};
        this.fileStream.on('data', (data) => {
            this.data.push(data);
        });
    }

    addData(buffer: Buffer) {
        let headerEnd = 0;
        // Do we not have a header?
        if (!this.header) {
            // We need to find a header
            if (this.stashedBuffer) {
                // We have stashed buffer content
                // Concatenate the stash with buffer
                buffer = Buffer.concat([this.stashedBuffer, buffer]);
            }

            // Find the end of the header
            headerEnd = buffer.indexOf('\r\n\r\n');

            if (headerEnd === -1) {
                // We haven't found the end of the header
                // Stash the buffer
                this.stashedBuffer = buffer;
            } else {
                // We found the end of the header
                // Create the header with the buffer
                this.createHeader(buffer.slice(0, headerEnd).toString().trim());
                // Store the remainder of the buffer into buffer
                buffer = buffer.slice(headerEnd + 4);
                this.stashedBuffer = undefined;
            }
        }
        // Do we have a header
        if (this.header) {
            // We have a header
            const data = buffer;
            if (this.fileName) {
                this.fileStream.push(data);
            } else {
                this.data.push(data);
            }
        }
    }

    decode() {
        if (this.fileName) {
            const output: IFileField = {
                filename: this.fileName,
                data: Buffer.concat(this.data as Buffer[]),
                type: this.fileType,
            };
            return output;
        } else {
            const data = Buffer.concat(this.data as Buffer[]).toString();
            return data.substr(0, data.length - 2);
        }
    }

    private createHeader(row: string) {
        this.header = FormDataHeader.create(row);
        const contentDisposition = this.header.contentDisposition;
        if (contentDisposition) {
            this.name = contentDisposition.hash.name;
            this.fileName = contentDisposition.hash.filename;
        }
        this.fileType = this.header.contentType;
    }
}
