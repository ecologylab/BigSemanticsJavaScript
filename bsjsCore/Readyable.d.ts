// Readyable type definition.

export interface IReadyable {
  isReady(): boolean;
  onReady(callback: (err: Error, that: this)=>void): void;
  setReady(): void;
  setError(err: Error): void;
}

export declare class Readyable implements IReadyable {
  private ready: boolean;
  private callbackQueue: Array<Function>;
  private error: Error;

  isReady(): boolean;
  onReady(callback: (err: Error, that: this)=>void): void;
  setReady(): void;
  setError(err: Error): void;
}

export default Readyable;