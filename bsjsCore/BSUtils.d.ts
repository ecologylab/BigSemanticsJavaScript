// BSUtils type definitions.

import { Metadata } from './BigSemantics';

export var BSUtils: {
  unwrap(target: Object): Metadata;
  getType(metadata: Metadata): string;
}
