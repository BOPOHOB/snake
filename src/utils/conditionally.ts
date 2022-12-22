function conditionally<T>(key: string, condition: boolean, value: T) { return condition ? { [key]: value } : {}; }
function spreadIfArray<T>(value: T): [] | T { return Array.isArray(value) ? value : []; }

export { conditionally, spreadIfArray };
