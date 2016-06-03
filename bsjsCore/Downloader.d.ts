// Downloader type definition.

export interface Response {
  location: string;
  otherLocations?: Array<string>;

  code: number;
  contentType?: string;
  charset?: string;

  entity?: Object;
  xml?: Object;
  text?: string;
}

export interface IDownloader {
  httpGet(
    location: string,
    options: Object,
    callback: (err: any, resp: Response)=>void
  ): void;
}

export declare class Downloader implements IDownloader {
  constructor(options?: any);
  httpGet(
    location: string,
    options: any,
    callback: (err: any, resp: Response)=>void
  ): void;
}

export default Downloader;