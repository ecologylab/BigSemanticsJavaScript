/**
 * BigSemantics API.
 */

import * as Promise from 'bluebird';
import ParsedURL from './ParsedURL';
import Readyable from './Readyable';
import {
  HttpResponse,
  MetaMetadata,
  BuildInfo,
  Repository,
  TypedRepository,
  Metadata,
  TypedMetadata,
  BSResult,
} from './types';
import { PreFilter } from './FieldOps';
import RepoMan, {
  RepoOptions,
  RepoCallOptions,
  RepoManService,
} from './RepoMan';
import { RequestOptions, Downloader } from './Downloader';
import { ExtractionOptions, Extractor } from './Extractor';
import { Cache, BaseCache } from './Cache';

/**
 * Options for a BigSemantics implementation.
 */
export interface BigSemanticsOptions extends RepoOptions {
  timeout?: number; // TODO implement support for timeout
  repoOptions?: RepoOptions;
}

/**
 * Options for extracting a metadata instance.
 */
export interface BigSemanticsCallOptions extends RepoCallOptions {
  timeout?: number; // TODO implement support for timeout

  mmd?: MetaMetadata;
  mmdName?: string;
  repoCallOptions?: RepoCallOptions;

  response?: HttpResponse;
  useDownloader?: string;
  requestOptions?: RequestOptions;

  useExtractor?: string;
  extractionOptions?: ExtractionOptions;

  includeMmdInResult?: boolean;
}

/**
 * A general interface for BigSemantics.
 */
export interface BigSemantics extends RepoManService {
  /**
   * Loads a metadata instance from the given location.
   *
   * @param {string | ParsedURL} location
   * @param {MetadataOptions} options
   * @return {Promise<MetadataResult>}
   */
  loadMetadata(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<BSResult>;

  /**
   * Loads an initial metadata instance from the given location.
   * This method picks the appropriate wrapper and applies location filtering,
   * but does not initiate network operations.
   *
   * @param {string | ParsedURL} location
   * @param {MetadataOptions} options
   * @return {Promise<MetadataResult>}
   *   Note that the result contains an initial, thus incomplete, metadata.
   */
  loadInitialMetadata(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<BSResult>;

  getBuildInfo(options?: BigSemanticsCallOptions): Promise<BuildInfo>;
  getRepository(options?: BigSemanticsCallOptions): Promise<TypedRepository>;
  getUserAgentString(userAgentName: string, options?: BigSemanticsCallOptions): Promise<string>;
  getDomainInterval(domain: string, options?: BigSemanticsCallOptions): Promise<number>;
  loadMmd(name: string, options?: BigSemanticsCallOptions): Promise<MetaMetadata>;
  selectMmd(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<MetaMetadata>;
  normalizeLocation(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<string>;
}
