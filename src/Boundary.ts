export class Boundary {
    static getBoundaries(buffer: Buffer, boundaryText: string): Boundary[] {
        const boundaries: Boundary[] = [];
        const length = buffer.length;
        let index = 0;
        while (index < length) {
            const boundary = Boundary.getBoundary(buffer, boundaryText, index);
            if (boundary.start === -1) {
                break;
            } else {
                index = boundary.end;
                boundaries.push(boundary);
            }
        }
        if (boundaries.length) {
            const lastBoundary = boundaries[boundaries.length - 1];
            lastBoundary.final = this.isFinalBoundary(buffer, lastBoundary);
        }
        return boundaries;
    }

    private static isFinalBoundary(buffer: Buffer, boundary: Boundary) {
        const nextChars = buffer.slice(boundary.end, boundary.end + 2).toString('ascii');
        return nextChars[0] === '-' && nextChars[1] === '-';
    }

    /**
     *
     * @param buffer
     * @param offset
     * @return an object with the start index of the boundary, and the last index after the boundary
     */
    private static getBoundary(buffer: Buffer, boundaryText: string, offset = 0): Boundary {
        const start = buffer.indexOf(boundaryText, offset, 'ascii');
        const end = start + boundaryText.length;
        return new Boundary(start, end);
    }

    start: number;
    end: number;
    final: boolean;

    constructor(start: number, end: number, final = false) {
        this.start = start;
        this.end = end;
        this.final = final;
    }
}
