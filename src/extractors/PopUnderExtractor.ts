/**
 * A remote extractor using pop-under windows.
 */

/// <reference types="chrome" />

import * as Promise from 'bluebird';
import {
  HttpResponse,
  MetaMetadata,
  TypedMetadata,
} from "../core/types.d";
import { BigSemantics } from '../core/BigSemantics';
import {
  RemoteExtractor,
  RemoteExtractionTask,
  RemoteExtractionOptions
} from "./RemoteExtractor";

type Window = chrome.windows.Window;

/**
 *
 */
export interface PopUnderExtractionOptions extends RemoteExtractionOptions {
  senderId: number;
}

/**
 *
 */
export class PopUnderExtractionTask extends RemoteExtractionTask {
  senderId: number;
  popUnderId: number;

  constructor(
    location: string,
    mmd: MetaMetadata,
    timeout: number,
    senderId: number
  ) {
    super(location, mmd, timeout);
    this.senderId = senderId;
  }
}

/**
 *
 */
export default class PopUnderExtractor extends RemoteExtractor {
  name = 'popUnder';

  private tasksById: { [id: number]: PopUnderExtractionTask } = {};

  extractMetadata(
    response: HttpResponse,
    mmd: MetaMetadata,
    bigSemanticsApi: BigSemantics = null,
    options: PopUnderExtractionOptions
  ): Promise<TypedMetadata> {
    return super.extractMetadata(response, mmd, bigSemanticsApi, options);
  }

  protected newTask(
    response: HttpResponse,
    mmd: MetaMetadata,
    options: PopUnderExtractionOptions
  ): PopUnderExtractionTask {
    return new PopUnderExtractionTask(
      response.location,
      mmd,
      options.timeout || this.defaultTimeout,
      options.senderId
    );
  }

  start(location: string): void {
    let task = this.tasks[location] as PopUnderExtractionTask;
    if (task) {
      chrome.runtime.getPlatformInfo(platformInfo => {
        switch (platformInfo.os) {
          case 'win':
            this.popMinimize(task);
            break;
          case 'mac':
            this.popUnderAsPopup(task);
            break;
          default:
            console.warn("PopUnder not supported on platform " + platformInfo.os);
        }
      });
    }
  }

  finish(location: string): void {
    let task = this.tasks[location] as PopUnderExtractionTask;
    if (task) {
      chrome.windows.remove(task.popUnderId);
      delete this.tasksById[task.popUnderId];
    }
  }

  private popMinimize(task: PopUnderExtractionTask): void {
    chrome.windows.create({
      url: task.location,
      state: 'minimized',
    }, this.onPopUnderLoad(task));
  }

  private popUnderAsPopup(task: PopUnderExtractionTask): void {
    chrome.windows.getCurrent(currWin => {
      let newTop = currWin.top + currWin.height - 200;
      let newLeft = currWin.left + currWin.width - 300;
      chrome.windows.create({
        url: task.location,
        type: 'popup',
        state: 'normal',
        focused: false,
        width: 10,
        height: 10,
        top: newTop,
        left: newLeft,
      }, this.onPopUnderLoad(task));
    });
  }

  private onPopUnderLoad(task: PopUnderExtractionTask): (Windows)=>void {
    return (popUnder: Window) => {
      task.popUnderId = popUnder.id;
      this.tasksById[task.location] = task;
      // FIXME why getLastFocused() and lastFocusedWin are needed?
      chrome.windows.getLastFocused(lastFocusedWin => {
        chrome.windows.update(task.senderId, {
          focused: true,
        });
      });
    };
  }
}
