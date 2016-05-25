// Downloader interface and an implementation using XHR.

/// <reference path="bstypes.d.ts" />

import { Response } from "./bstypes";

export interface IDownloader {
  httpGet(
    location: string,
    options: Object,
    callback: (err: any, resp: Response)=>void
  ): void;
}

export declare class Downloader implements IDownloader {
  constructor(options);
  httpGet(
    location: string,
    options: Object,
    callback: (err: any, resp: Response)=>void
  ): void;
}

