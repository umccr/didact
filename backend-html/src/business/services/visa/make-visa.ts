import { EdDsaJose } from './ed-dsa-jose';
import forge, { jsbn } from 'node-forge';
import base64url from 'base64url';
import { RsaJose } from './rsa-jose';

export function makeVisaContent(assertions: string[]): string {
  return '';
}

/**
 *
 * @param keys the definitions of all the keys
 * @param visaContent a string of visa content we want to sign
 * @param kid the selected kid to use for signing
 */
export function makeVisaSigned(keys: { [kid: string]: EdDsaJose | RsaJose }, visaContent: string, kid: string): any {
  const keyPrivateJose = keys[kid];

  if (!keyPrivateJose) throw Error(`Cant make a visa with the unknown kid ${kid}`);

  if (keyPrivateJose.kty === 'OKP') {
    const seed = forge.util.hexToBytes(keyPrivateJose.dHex);

    if (seed.length != 32) throw Error(`Private keys (seed) for ED25519 must be exactly 32 octets but for kid ${kid} was ${seed.length}`);

    const keypair = forge.pki.ed25519.generateKeyPair({ seed: seed });
    const msgBuffer = Buffer.from(visaContent, 'utf8');

    // console.log(msgBuffer);

    const signature = forge.pki.ed25519.sign({
      message: msgBuffer,
      privateKey: keypair.privateKey,
    });

    // const signatureForgeBuffer = forge.util.createBuffer(signature);

    return {
      v: visaContent,
      k: kid,
      s: base64url(Buffer.from(signature)),
      // sHex: signatureForgeBuffer.toHex()
    };
  }
}

/*
  if (keyPrivateJose.kty === 'RSA') {
    const keypair = forge.pki.rsa.generateKeyPair({ bits: 1024, e: 23424 });

    (forge.pki as any).setRsaPrivateKey(new forge.util.BigInteger(1), new BigInteger(2));

    var publicKey = PKI.publicKeyFromPem(_pem.publicKey);
    var md = MD.sha1.create();
    md.update('0123456789abcdef');
    var signature = privateKey.sign(md);
    ASSERT.ok(publicKey.verify(md.digest().getBytes(), signature));
  }
}
*/
