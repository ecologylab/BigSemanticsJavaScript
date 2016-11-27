/**
 * Use BigSemantics web service to extract metadata.
 */

import * as Promise from 'bluebird';
import ParsedURL, { QueryMap } from '../core/ParsedURL';
import {
  HttpResponse,
  MetaMetadata,
  TypedMetadata,
} from '../core/types.d';
import { RequestOptions } from '../core/Downloader';
import ServiceHelper from '../downloaders/ServiceHelper';
import { ExtractionOptions, Extractor } from '../core/Extractor';
import { BigSemantics } from '../core/BigSemantics';

/**
 *
 */
export interface ServiceExtractionOptions extends ExtractionOptions {
  requestOptions?: RequestOptions;
}

/**
 * An extractor that delegates to BigSemantics web service.
 */
export default class ServiceExtractor implements Extractor {
  name = 'service';

  private serviceHelper: ServiceHelper = new ServiceHelper();

  constructor(serviceBase: string | ParsedURL, appId?: string, appVer?: string) {
    this.serviceHelper.load(serviceBase, appId, appVer);
  }

  extractMetadata(
    response: HttpResponse,
    mmd: MetaMetadata,
    bigSemanticsApi?: BigSemantics,
    options: ServiceExtractionOptions = {},
  ): Promise<TypedMetadata> {
    if (!response.location) {
      return Promise.reject(new Error("response.location required."));
    }

    if (response.entity || response.xml || response.text) {
      console.warn("ServiceExtractor: local response body ignored for " + response.location);
    }

    if (mmd) {
      console.warn("ServiceExtractor: local mmd <" + mmd.name + "> ignored for " + response.location);
    }

    let query: QueryMap = {
      url: response.location,
    };
    return this.serviceHelper
      .callJSONService('metadata.json', query, options.requestOptions)
      .then(bsresp => {
        if (!bsresp.metadata) {
          throw new Error("Missing metadata in response for " + response.location);
        }
        return bsresp.metadata;
      });
  }
}
