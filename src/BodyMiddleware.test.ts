import { createServer, Server } from 'http';

import request from 'supertest';
import { Handler } from 'sierra';

import { BodyMiddleware } from './BodyMiddleware';

describe('BodyMiddleware', function () {
    describe('application/json', function () {
        let server: Server;
        let handler: Handler;

        beforeEach(async function () {
            handler = new Handler();
            server = createServer(handler.callback);
        });

        it('should read "application/json" data', async function () {
            handler.use(BodyMiddleware).use((context) => {
                return context.data.body;
            });

            await request(server)
                .post('/')
                .send({
                    value: true,
                })
                .expect(200, {
                    value: true,
                });
        });

        it('should handle badly formed "application/json" data', async function () {
            handler.use(BodyMiddleware).use((context) => {
                return context.data.body;
            });

            const { text } = await request(server)
                .post('/')
                .set('Content-Type', 'application/json')
                .send('{ "value": true ')
                .expect(500);
            expect(text).toBe('"Unexpected end of JSON input"');
        });
    });

    describe('multipart/form-data', function () {
        let server: Server;
        let handler: Handler;

        beforeEach(async function () {
            handler = new Handler();
            server = createServer(handler.callback);
        });

        it('should read "multipart/form-data" data', async function () {
            handler.use(BodyMiddleware).use((context) => {
                return context.data.body;
            });

            await request(server).post('/').field('value', true).expect(200, {
                value: 'true',
            });
        });

        it.skip('should handle badly formed "multipart/form-data" data', async function () {
            handler.use(BodyMiddleware).use((context) => {
                return context.data.body;
            });

            const { text } = await request(server)
                .post('/')
                .set('Content-Type', 'multipart/form-data')
                .send('value=true')
                .expect(200);
            expect(text).toBe({
                value: 'true',
            });
        });
    });

    describe('application/x-www-form-urlencoded', function () {
        let server: Server;
        let handler: Handler;

        beforeEach(async function () {
            handler = new Handler();
            server = createServer(handler.callback);
        });

        it('should read "application/x-www-form-urlencoded" data', async function () {
            handler.use(BodyMiddleware).use((context) => {
                return context.data.body;
            });

            await request(server)
                .post('/')
                .type('form')
                .send({
                    value: true,
                })
                .expect(200, {
                    value: 'true',
                });
        });

        it.skip('should handle badly formed "application/x-www-form-urlencoded" data', async function () {});
    });
});
