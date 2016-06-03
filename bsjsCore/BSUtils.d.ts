// BSUtils type definitions.

import { Metadata } from './BigSemantics';

export class BSUtils {
  static unwrap(target: Object): Metadata;
  static getType(metadata: Metadata): string;
}

export default BSUtils;