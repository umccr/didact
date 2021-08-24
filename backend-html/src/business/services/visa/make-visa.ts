import {EdDsaJose} from "./ed-dsa-jose";
import forge from "node-forge";
import base64url from "base64url";

export function makeVisaContent(assertions: string[]): string {


    return ""
}

/**
 *
 * @param keys the definitions of all the keys
 * @param visaContent a string of visa content we want to sign
 * @param kid the selected kid to use for signing
 */
export function makeVisaSigned(keys: { [kid: string]: EdDsaJose }, visaContent: string, kid: string): any {

    const keyPrivateJose = keys[kid];

    if (!keyPrivateJose)
        throw Error(`Cant make a visa with the unknown kid ${kid}`);

    const seed = forge.util.hexToBytes(keyPrivateJose.dHex);

    if (seed.length != 32)
        throw Error(`Private keys (seed) for ED25519 must be exactly 32 octets but for kid ${kid} was ${seed.length}`);

    const keypair = forge.pki.ed25519.generateKeyPair({seed: seed});
    const msgBuffer = Buffer.from(visaContent, 'utf8');

    // console.log(msgBuffer);

    const signature = forge.pki.ed25519.sign({
        message: msgBuffer,
        privateKey: keypair.privateKey
    });

    const signatureForgeBuffer = forge.util.createBuffer(signature);

    return {
        v: visaContent,
        k: kid,
        s: base64url(Buffer.from(signature)),
        // sHex: signatureForgeBuffer.toHex()
    }
}
