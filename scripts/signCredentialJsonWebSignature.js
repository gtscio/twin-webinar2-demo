// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/* eslint-disable no-console */

/**
 * Script to sign an evidence credential using the JsonWebSignature2020 proof type
 *
 * Input:
 * - A JSON wrapping the credential in JSON-LD within the `credential` member.
 * - The verification method that can be used to verify the proof (signature)
 * - The private key of the signer of the Credential, typically the issuer.
 * Output: The Credential together with the proof
 */
import { exit } from 'node:process';
import { ProofHelper, ProofTypes } from '@twin.org/standards-w3c-did';

const jsonStrData = process.argv[2];
const verificationMethod = process.argv[3];
const privateKeyData = process.argv[4];

if (!jsonStrData || !verificationMethod || !privateKeyData) {
	console.error(
		'Three parameters are needed: <credential as JSON> <verification method> <private key as JSON>'
	);
	exit(-1);
}
let jsonObject = JSON.parse(jsonStrData);
if (jsonObject.credential) {
	jsonObject = jsonObject.credential;
} else {
	console.error('No credential has been supplied in the JSON content');
	exit(-1);
}
delete jsonObject.proof;

const privateKeyJsonObject = JSON.parse(privateKeyData);
if (!privateKeyJsonObject.privateKeyJwk) {
	console.error('No private key JWK has been supplied in the JSON content');
	exit(-1);
}

const privateKeyJwk = privateKeyJsonObject.privateKeyJwk;

const signer = ProofHelper.createSignerVerifier(ProofTypes.JsonWebSignature2020);
const proof = {
	type: ProofTypes.JsonWebSignature2020,
	verificationMethod,
	proofPurpose: 'assertionMethod',
	created: '2025-03-11T15:48:28.943+01:00'
};

signer
	.createProof(jsonObject, proof, privateKeyJwk)
	.then(calculatedProof => {
		console.log(JSON.stringify(calculatedProof, null, 2));
		return 0;
	})
	.catch(err => {
		console.error(err);
	});
