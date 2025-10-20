import type { IJsonLdNodeObject } from '@twin.org/data-json-ld';

export type JsonLdWithGlobalId = IJsonLdNodeObject & { globalId?: string };

export type TypeMatcher = (
  actualType: string | string[] | undefined,
  expectedType: string,
) => boolean;
