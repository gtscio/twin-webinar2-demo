// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/* eslint-disable no-console */

/**
 * Script for calculating a digest of a credential following the subresource integrity
 * specification. See https://www.w3.org/TR/sri/
 *
 * Input: The JSON content of the credential as a string
 * Output: The digest following the SRI representation format.
 */

import { JsonHelper, Converter } from "@twin.org/core";
import { Sha256, Sha512 } from "@twin.org/crypto";

const jsonStrData = process.argv[2];

if (!jsonStrData) {
    console.log("Please provide JSON Content");
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(-1);
}

let jsonObject = JSON.parse(jsonStrData);
if (jsonObject.credential) {
    jsonObject = jsonObject.credential;
}
delete jsonObject.proof;

const canonical = JsonHelper.canonicalize(jsonObject);

const hash = sha256(canonical);

console.log(`sha256-${hash}`);

function sha256(input) {
    if (!input) {
        return null;
    }

    return Converter.bytesToBase64(Sha256.sum256(Converter.utf8ToBytes(input)));
}
