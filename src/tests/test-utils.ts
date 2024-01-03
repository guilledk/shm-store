function randomPrimitive(): any {
    const types = [() => Math.random(), () => Math.random() < 0.5, () => Math.random().toString(36).substring(7)];
    return types[Math.floor(Math.random() * types.length)]();
}

export function randomObject(maxDepth: number, currentDepth = 0): any {
    if (currentDepth === maxDepth) {
        return randomPrimitive();
    }

    let obj: any = {};
    if (currentDepth > 0 && Math.random() < 0.5)
        obj = [];

    const elementsCount = Math.floor(Math.random() * 5) + 1; // Generate between 1 and 5 elements

    if (Array.isArray(obj)) {
        for (let i = 0; i < elementsCount; i++) {
            obj.push(randomObject(maxDepth, currentDepth + 1));
        }
    } else {
        for (let i = 0; i < elementsCount; i++) {
            const key = Math.random().toString(36).substring(7);
            obj[key] = randomObject(maxDepth, currentDepth + 1);
        }
    }

    return obj;
}

export function randomHexString (length: number): string {
    return [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}