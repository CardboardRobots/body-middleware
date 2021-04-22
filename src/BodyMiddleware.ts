import { Context } from 'sierra';
import { decode } from '@cardboardrobots/query-string';

import { BufferDecoder } from './BufferDecoder';
import { ErrorMessage } from './Errors';

export async function BodyMiddleware<BODY, CONTEXT extends Context<{ body: BODY }>>(context: CONTEXT) {
    const verb = context.request.method?.toLowerCase();
    if (verb === 'post' || verb === 'put') {
        switch (context.contentType.mediaType) {
            case 'multipart/form-data':
                return handleFormData(context);
            case 'application/x-www-form-urlencoded':
                return handleUrlEncoded(context);
            case 'application/json':
                return handleJson(context);
            case 'text/plain':
            default:
                return handleText(context);
        }
    }
}

async function handleJson<BODY, CONTEXT extends Context<{ body: BODY }>>(context: CONTEXT) {
    const body: Buffer[] = [];
    return new Promise<any>((resolve, reject) => {
        try {
            context.request
                .on('error', (error) => {
                    reject(error);
                })
                .on('data', (data) => {
                    if (typeof data === 'string') {
                        body.push(Buffer.from(data));
                    } else {
                        body.push(data);
                    }
                })
                .on('end', () => {
                    try {
                        const bufferedData = Buffer.concat(body).toString().trim();
                        context.data.body = bufferedData ? JSON.parse(bufferedData) : null;
                        resolve(context.data.body);
                    } catch (error) {
                        reject(error);
                    }
                });
        } catch (error) {
            reject(error);
        }
    });
}

async function handleUrlEncoded<BODY, CONTEXT extends Context<{ body: BODY }>>(context: CONTEXT) {
    const body: Buffer[] = [];
    return new Promise<any>((resolve, reject) => {
        try {
            context.request
                .on('error', (error) => {
                    reject(error);
                })
                .on('data', (data) => {
                    if (typeof data === 'string') {
                        body.push(Buffer.from(data));
                    } else {
                        body.push(data);
                    }
                })
                .on('end', () => {
                    try {
                        const bufferedData = Buffer.concat(body).toString().trim();
                        if (bufferedData) {
                            const data = decode(bufferedData);
                            context.data.body = data as any;
                        } else {
                            context.data.body = null as any;
                        }
                        resolve(context.data.body);
                    } catch (error) {
                        reject(error);
                    }
                });
        } catch (error) {
            reject(error);
        }
    });
}

async function handleText<BODY, CONTEXT extends Context<{ body: BODY }>>(context: CONTEXT) {
    const body: Buffer[] = [];
    return new Promise<any>((resolve, reject) => {
        try {
            context.request
                .on('error', (error) => {
                    reject(error);
                })
                .on('data', (data) => {
                    if (typeof data === 'string') {
                        body.push(Buffer.from(data));
                    } else {
                        body.push(data);
                    }
                })
                .on('end', () => {
                    try {
                        const bufferedData = Buffer.concat(body).toString().trim();
                        context.data.body = bufferedData as any;
                        resolve(context.data.body);
                    } catch (error) {
                        reject(error);
                    }
                });
        } catch (error) {
            reject(error);
        }
    });
}

async function handleFormData<BODY, CONTEXT extends Context<{ body: BODY }>>(context: CONTEXT) {
    const { boundary } = context.contentType;
    if (!boundary) {
        // TODO: Create error class
        throw new Error(ErrorMessage.NoBoundary);
    }
    const bufferDecoder = new BufferDecoder(boundary, () => {});
    return new Promise<any>((resolve, reject) => {
        try {
            context.request
                .on('error', (error) => {
                    reject(error);
                })
                .on('data', (data) => {
                    if (typeof data === 'string') {
                        bufferDecoder.addData(Buffer.from(data));
                    } else {
                        bufferDecoder.addData(data);
                    }
                })
                .on('end', () => {
                    try {
                        context.data.body = bufferDecoder.decode() as any;
                        resolve(context.data.body);
                    } catch (error) {
                        reject(error);
                    }
                });
        } catch (error) {
            reject(error);
        }
    });
}
