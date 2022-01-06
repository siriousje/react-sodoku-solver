// just some functions that I use a lot but don't really have a home

export function deepCopy<T>(obj: T) : T {
    return JSON.parse(JSON.stringify(obj));
}