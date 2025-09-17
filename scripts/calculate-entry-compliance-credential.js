/**
 * Calculates Compliance Credentials for Data Resources, Service Offerings and Data Space Connectors
 */

import { exec } from "node:child_process";
import path from "node:path";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2); // skip "node" and script name

if (args.length < 4) {
    console.error("Error: You must provide at least four arguments.");
    console.error("Usage: node app.js <entry type> <participant name> <entry name> <entry id>");
    process.exit(1); // exit with failure code
}

// Extract the four arguments
const [entryType, participantName, entryName, entryId] = args;

const commandLine = `./issue-${entryType}-credential.sh ${participantName} ${entryName} ${entryId}`;
exec(commandLine, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }

    const newPath = renameFile(stderr, participantName + "-" + entryName + "-" + entryType + ".json");

    console.log("Credential created");

    const identityFile = path.resolve(path.join("../dataset/identities", participantName, participantName + ".json"));
    let identityData = readJson(identityFile);
    console.log(identityData.did, identityData.privateKeyJwk.kid);

    const signingCommand = `node ./signCredentialJsonWebSignature "$(cat ${newPath.toString()})" "${identityData.did}#${
        identityData.privateKeyJwk.kid
    }" "$(cat ${identityFile.toString()})"`;
    exec(signingCommand, (error, stdout, stderr) => {
        const credential = stdout;
        const jsonContent = JSON.parse(stdout);
        const id = jsonContent.id;
        const fileName = id.split("/").pop();

        console.log("Writing file", fileName);
        const credentialPath = path.resolve(path.join("../docs/public-credentials", fileName));
        writeFileSync(credentialPath, credential, "utf-8");

        // Now it is needed to calculate the digest
        const digestCommand = `node ./calculateDigest.js "$(cat ${credentialPath})"`;
        exec(digestCommand, (error, stdout, stderr) => {
            const digest = stdout.trim();

            const claimsPath = `../dataset/claims/${entryType}s`;
            const claimsTemplateFile = path.resolve(path.join(claimsPath, `compliant-${entryType}-template.json`));
            const claimsTemplate = readJson(claimsTemplateFile);

            claimsTemplate.evidence[0].id = id;
            claimsTemplate.evidence[0].digestSRI = digest;

            writeFileSync(
                path.resolve(path.join(claimsPath, entryName + "-" + `${entryType}-compliant.json`)),
                JSON.stringify(claimsTemplate, null, 2)
            );

            // And now calling the issuance of a compliance credential
            const complianceCredentialCmd = `./issue-compliance-credential-${entryType}.sh ${entryName} ${entryId}`;
            exec(complianceCredentialCmd, (error, stdout, stderr) => {
                renameFile(stderr, entryName + "-" + `compliant-${entryType}.json`);
            });
        });
    });
});

function renameFile(stderr, newFileName) {
    let result = stderr.trim();
    result = result.substring(0, result.length - 1);

    const index = result.indexOf("/ext/credentials");
    const fullPath = result.substring(index).trim();

    const parts = fullPath.split("/");
    const file = parts.pop();

    console.log(parts);

    const base = path.join("../dataset", parts.slice(2).join(path.sep));
    console.log(base);

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
