/* eslint-disable no-param-reassign */
import { Field } from './Field';
import { Boundary } from './Boundary';
import { IFileHandler } from './IFileHandler';

export class BufferDecoder {
    boundary: string;
    // boundaryEnd: string;
    boundaryLength: number;
    bufferRemainder: Buffer;
    fields: Field[] = [];
    currentField?: Field;
    firstChunk = true;
    fileHandler: IFileHandler;

    constructor(httpBoundary: string, fileHandler: IFileHandler) {
        this.boundary = `--${httpBoundary}`;
        // this.boundaryEnd = httpBoundary + '--';
        // Add two to the end for the '--'
        this.boundaryLength = this.boundary.length + 2;
        this.bufferRemainder = Buffer.alloc(this.boundaryLength);
        this.fileHandler = fileHandler;
    }

    decode() {
        const result: Record<string, any> = {};
        this.fields.forEach((field) => {
            if (field.name) {
                result[field.name] = field.decode();
            }
        });

        return result;
    }

    addData(buffer: Buffer) {
        // Get buffer and stash
        buffer = this.unStash(buffer);

        // Get all boundaries from buffer
        const boundaries = Boundary.getBoundaries(buffer, this.boundary);

        // Do we have any boundaries?
        // eslint-disable-next-line no-negated-condition
        if (!boundaries.length) {
            // We have no boundaries
            // All data goes to the last Field
            if (this.currentField) {
                this.currentField.addData(this.stash(buffer));
            }
        } else {
            // We do have boundaries
            let previousBoundary: Boundary | undefined;
            for (let index = 0, length = boundaries.length - 1; index <= length; index++) {
                const boundary = boundaries[index];

                // Push the data from before the boundary

                // If we have a previous boundary, use it, otherwise start from 0
                const start = previousBoundary ? previousBoundary.end : 0;

                // Push all data into the old field
                if (this.currentField && boundary.start > 0) {
                    this.currentField.addData(buffer.slice(start, boundary.start));
                }

                // Do we have the end boundary?
                if (!boundary.final) {
                    // We do not have the end boundary

                    // Create new Field
                    this.currentField = new Field(this.fileHandler);
                    this.fields.push(this.currentField);

                    // Do we have the last boundary of this chunk?
                    if (index === length) {
                        // We have the last boundary of this
                        this.currentField.addData(this.stash(buffer, boundary.end));
                    }
                }

                // Store boundary
                previousBoundary = boundary;
            }
        }
    }

    private stash(buffer: Buffer, start = 0) {
        const remainderLength = start + buffer.length - this.boundaryLength;
        this.bufferRemainder = buffer.slice(remainderLength);
        if (remainderLength > 0) {
            return buffer.slice(start, remainderLength);
        } else {
            return Buffer.alloc(0);
        }
    }

    private unStash(buffer: Buffer) {
        if (this.bufferRemainder.length > 0) {
            return Buffer.concat([this.bufferRemainder, buffer]);
        } else {
            return buffer;
        }
    }
}
