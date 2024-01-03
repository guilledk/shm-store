import {MemoryBounds, SharedObjectStore} from "../shm.js";
import workerpool from "workerpool";

function sosFetchObject(args: {
    sharedMem: SharedArrayBuffer;
    memoryMap: {[key: string]: MemoryBounds};
    key: string
}): any {
    return SharedObjectStore.fromMemoryMap(
        args.sharedMem, args.memoryMap
    ).get(args.key);
};


workerpool.worker({sosFetchObject})