/**
 * Extracting metadata using an <iframe>.
 */

import * as Promise from 'bluebird';
import {
  HttpResponse,
  MetaMetadata,
  TypedMetadata,
} from '../core/types';
import { BigSemantics } from '../core/BigSemantics';
import {
  RemoteExtractor,
  RemoteExtractionTask,
  RemoteExtractionOptions
} from './RemoteExtractor';

export class IframeExtractionTask extends RemoteExtractionTask {
  iframe: HTMLIFrameElement;
  constructor(location: string, mmd: MetaMetadata, timeout: number) {
    super(location, mmd, timeout);
  }
}

/**
 * A remote extractor using a <iframe> element.
 */
export class IframeExtractor extends RemoteExtractor {
  name = 'iframe';

  protected newTask(
    response: HttpResponse,
    mmd: MetaMetadata,
    options: RemoteExtractionOptions
  ): IframeExtractionTask {
    return new IframeExtractionTask(
      response.location,
      mmd,
      options.timeout || this.defaultTimeout
    );
  }

  start(location: string): void {
    let task = this.tasks[location] as IframeExtractionTask;
    if (task) {
      let iframe = document.createElement('iframe');
      iframe.setAttribute('src', task.location);
      document.body.appendChild(iframe);
      task.iframe = iframe;
    }
  }

  finish(location: string): void {
    let task = this.tasks[location] as IframeExtractionTask;
    if (task) {
      if (task.iframe.parentNode) {
        task.iframe.parentNode.removeChild(task.iframe);
      }
      delete task.iframe;
    }
  }
}

export default IframeExtractor;
