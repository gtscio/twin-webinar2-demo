/**
 * Calculates Compliance Credentials for Participants, Data Resources, Service Offerings and Data Space Connectors
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";

function usage() {
    console.error("Error: You must provide at least 2 arguments.");
    console.error("Usage: node app.js <entry type> <participant name> <entry name> <entry id>");
    console.error("Entry type can be: 'participant', 'data-resource', 'service-offering' or 'data-space-connector'");
    process.exit(1); // exit with failure code
}

const args = process.argv.slice(2); // skip "node" and script name

// Extract the four arguments
const [entryType, participantName, entryName, entryId] = args;

if (!entryType && !participantName) {
    usage();
}

if (entryType !== "participant" && args.length < 4) {
    usage();
}

const credentialTypes = [entryType];
if (entryType === "participant") {
    credentialTypes.push("participant-terms-conditions");
}

const claimsPath = `../dataset/claims/${entryType}s`;

const claimsTemplateFile = path.resolve(path.join(claimsPath, `compliant-${entryType}-template.json`));
const claimsTemplate = readJson(claimsTemplateFile);

issueComplianceCredential();

// The meaty part is here
function issueComplianceCredential() {
    let evidenceIndex = 0;
    for (const credentialType of credentialTypes) {
        const commandLine = `./issue-${credentialType}-credential.sh ${participantName} ${entryName} ${entryId}`;
        const result = spawnSync("sh", ["-c", commandLine]);
        const stderr = result.stderr.toString();
        if (result.error) {
            console.error(`Error: ${result.error.message}`);
            console.error(result.stdout);
            process.exit(-1);
        }

        const newPath = renameFile(
            stderr,
            participantName + "-" + (entryName ? entryName + "-" : "") + credentialType + ".json"
        );
        console.log("Credential created", newPath);

        const identityFile = path.resolve(
            path.join("../dataset/identities", participantName, participantName + ".json")
        );
        let identityData = readJson(identityFile);
        console.log("identity data: ", identityData.did, identityData.privateKeyJwk.kid);

        const { signedCredentialPath, credentialId } = createSignedCredential(
            newPath.toString(),
            identityData,
            identityFile
        );

        // Now it is needed to calculate the digest
        const digestCommand = `node ./calculateDigest.js "$(cat ${signedCredentialPath})"`;
        const { output, error } = spawnSync("sh", ["-c", digestCommand]);
        if (error) {
            console.error("Error while calculating digest", error);
            process.exit(-1);
        }
        const digest = output[1].toString().trim();

        claimsTemplate.evidence[evidenceIndex].id = credentialId;
        claimsTemplate.evidence[evidenceIndex].digestSRI = digest;

        evidenceIndex++;
    }

    let finalClaimsPath = claimsPath;
    if (entryType === "participant") {
        finalClaimsPath += path.sep + "compliance";
    }

    // Writing claims
    const compliantClaimsFilePath = path.resolve(
        path.join(finalClaimsPath, (entryName ? entryName : participantName) + `-${entryType}-compliant.json`)
    );
    writeFileSync(compliantClaimsFilePath, JSON.stringify(claimsTemplate, null, 2));
    console.log("Compliant claims file written", compliantClaimsFilePath);

    // And now calling the issuance of a compliance credential
    const complianceCredentialCmd = `./issue-compliance-credential-${entryType}.sh ${
        entryType === "participant" ? participantName : entryName
    } ${entryId}`;
    const { stderr, error } = spawnSync("sh", ["-c", complianceCredentialCmd]);
    if (error) {
        console.error("Error while creating compliance credential", error);
        process.exit(-1);
    }
    const finalComplianceCredentialPath = (entryName ? entryName : participantName) + `-compliant-${entryType}.json`;
    renameFile(stderr.toString(), finalComplianceCredentialPath);
    console.log("Compliance credential created successfully: ", finalComplianceCredentialPath);
}

function createSignedCredential(credentialPath, identityData, identityFile) {
    const signingCommand = `node ./signCredentialJsonWebSignature.js "$(cat ${credentialPath})" "${identityData.did}#${
        identityData.privateKeyJwk.kid
    }" "$(cat ${identityFile.toString()})"`;
    const { error, output } = spawnSync("sh", ["-c", signingCommand]);
    if (error) {
        console.error("Error while signing credential: ", error);
        process.exit(-1);
    }

    const credential = output[1].toString();
    const jsonContent = JSON.parse(credential);
    const id = jsonContent.id;
    const fileName = id.split("/").pop();

    const signedCredentialPath = path.resolve(path.join("../docs/public-credentials", fileName));
    writeFileSync(signedCredentialPath, credential, "utf-8");
    console.log("File written", signedCredentialPath);

    return { signedCredentialPath, credentialId: id };
}

function renameFile(stderr, newFileName) {
    let result = stderr.trim();
    result = result.substring(0, result.length - 1);

    const index = result.indexOf("/ext/credentials");
    const fullPath = result.substring(index).trim();

    const parts = fullPath.split("/");
    const file = parts.pop();

    const base = path.join("../dataset", parts.slice(2).join(path.sep));

    let filePath = path.resolve(path.join(base, file));
    // Now we need to rename the file
    const newPath = path.resolve(path.join(base, newFileName));
    rmSync(newPath, { force: true });
    renameSync(filePath, newPath);

    return newPath;
}

function readJson(file) {
    try {
        const data = readFileSync(file, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading JSON file:", err);
    }
}
