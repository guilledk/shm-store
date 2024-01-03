import { SharedObject, SharedObjectStore } from "../shm.js";
import { BSON } from "bson";
import { expect } from "chai";
import workerpool from "workerpool";
import path from 'path';
import {randomHexString, randomObject} from "./test-utils.js";
import {fileURLToPath} from "node:url";
const __dirname = fileURLToPath(new URL('.', import.meta.url));


describe('SharedObjectStore Tests', function() {

    it('should correctly create and validate SharedObjectStore', async function() {
        // generate random objects
        const testData: {[key: string]: {obj: any, shared: SharedObject<any>}} = {};
        for (let i = 0; i < 10; i++) {
            const obj = randomObject(3);
            testData[randomHexString(12)] = {
                obj,
                shared: SharedObject.fromObject(obj)
            };
        }

        // make sure buffers in shared objects make sense
        for (const data of Object.values(testData)) {
            expect(data.shared.obj).to.deep.equal(data.obj);
            expect(data.shared.raw).to.deep.equal(BSON.serialize(data.obj));
        }

        // create SOS at main thread
        const objMapping = {};
        for (const [key, data] of Object.entries(testData))
            objMapping[key] = data.shared;

        const sos = SharedObjectStore.fromObjects(objMapping);

        for (const [key, data] of Object.entries(testData))
            expect(sos.get(key)).to.deep.equal(data.obj);

        const pool = workerpool.pool(
            path.join(__dirname, 'test-worker.js'),
            {
                minWorkers: 3,
                maxWorkers: 3,
                workerType: 'thread'
            }
        );

        const fetchOneFromWorkerSOS = async (key: string) => {
            let result: any;
            let error: any | undefined;
            try {
                result = await pool.exec('sosFetchObject', [{
                    sharedMem: sos.sharedMem,
                    memoryMap: sos.getMemoryMap(),
                    key
                }])
            } catch (e) {
                error = e;
                console.error(e.message);
                console.error(e.stack);
            }
            return {result, error};
        };

        await Promise.all(
            Object.entries(testData).map(async ([account, data]) => {
                const fetchResult = await fetchOneFromWorkerSOS(account);
                expect(fetchResult.error, `worker returned error while fetch ${account}!`).to.be.undefined;
                expect(fetchResult.result, `worker result different from expected!`).to.deep.equal(data.obj);
            })
        );

        await pool.terminate();
    });

});
