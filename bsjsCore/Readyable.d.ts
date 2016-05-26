export declare class Readyable {
    private ready: boolean;
    private callbackQueue: Array<Function>;
    private error: Error;
    
    isReady(): boolean;
    onReady(callback: (err: Error, that: Readyable)=>void): void;
    setReady(): void;
    setError(err: Error): void;
}
