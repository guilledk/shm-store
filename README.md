# shm-store

Simple object map abstraction on top of a [`SharedArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) so that it can be passed around worker threads without transfering ownership (copying memory).

This is useful in particular when the only writer to the buffer is a single thread, with multiple readers. For multiple writer scenarios [`Atomics`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics) still needs to be used in order to avoid races.

## Usage

### Main thread:

*Note: Create the object store from BSON serializable objects*

```ts
import {SharedObject} from "shm-store";

const obj = {data: {account: 'testacc', delta: 1000}};
const otherObj = {buffer: '09afea0123cd', name: 'unknown'};

const objMapping = {
    myObject: SharedObject.fromObject(obj),
    myOtherObject: SharedObject.fromObj(otherObj)
}

const sos = SharedObjectStore.fromObjects(objMapping);

const pool = workerpool.pool(
    'worker-module.js',
    {
        minWorkers: 3,
        maxWorkers: 3,
        workerType: 'thread'
    }
);

const workerMyObject = await pool.exec('getObjectFromStore', [{
    sharedMem: sos.sharedMem,
    memoryMap: sos.getMemoryMap(),
    'myObject'
}]);

// this checks pass!
expect(workerMyObject).to.be.equal(obj);
expect(workerMyOther).to.be.equal(otherObj);
```
### `worker-module.js`

This worker module just opens up the passed store and fetches an object from it using the key provided as argument.

Note: This example uses the [`workerpool`](https://github.com/josdejong/workerpool) library but regular js [`Worker`](https://developer.mozilla.org/en-US/docs/Web/API/Worker)s should work as well (not tested).

```ts
import {MemoryBounds, SharedObjectStore} from "shm-store";
import workerpool from "workerpool";

function getObjectFromStore(args: {
    sharedMem: SharedArrayBuffer;
    memoryMap: {[key: string]: MemoryBounds};
    key: string
}): any {
    return SharedObjectStore.fromMemoryMap(
        args.sharedMem, args.memoryMap
    ).get(args.key);
};


workerpool.worker({getObjectFromStore})
```