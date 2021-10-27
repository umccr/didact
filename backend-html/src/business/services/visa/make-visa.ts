import { EdDsaJose } from './ed-dsa-jose';
import forge, { jsbn } from 'node-forge';
import base64url from 'base64url';
import { RsaJose } from './rsa-jose';
import { add, getUnixTime } from 'date-fns';
import cryptoRandomString from 'crypto-random-string';

/**
 * Create a compact visa with visa content, a key identifier - and signed by the corresponding key from the passed
 * in key set.
 *
 * @param keys the definitions of all the keys (kid -> hex string of Ed25519 seed)
 * @param kid the selected kid to use for signing
 * @param subjectId the subject of the visa (must end up matching the subject of the passport this goes into)
 * @param duration the duration for the visa
 * @param visaAssertions a set of visa assertions (should not include those mandatory assertions)
 */
export function makeVisaSigned(
  keys: { [kid: string]: EdDsaJose | RsaJose },
  kid: string,
  subjectId: string,
  duration: Duration,
  visaAssertions: string[],
): any {
  const keyPrivateJose = keys[kid];

  if (!keyPrivateJose) throw Error(`Cant make a visa with the unknown kid ${kid}`);

  // TODO: should check none of our mandatory assertions are in already

  // construct the actual visa string to sign from the list of assertions
  // we clone the input array as we are going to sort it
  const startingAssertions = Array.from(visaAssertions);

  const expiryDate = add(new Date(), duration);
  const visaJti = cryptoRandomString({ length: 16, type: 'alphanumeric' });

  startingAssertions.push(`et:${getUnixTime(expiryDate)}`, `iu:${subjectId}`, `iv:${visaJti}`);
  startingAssertions.sort();

  const visaContent = startingAssertions.join(' ');

  if (keyPrivateJose.kty === 'OKP') {
    const seed = forge.util.hexToBytes(keyPrivateJose.dHex);

    if (seed.length != 32) throw Error(`Private keys (seed) for ED25519 must be exactly 32 octets but for kid ${kid} was ${seed.length}`);

    const keypair = forge.pki.ed25519.generateKeyPair({ seed: seed });
    const msgBuffer = Buffer.from(visaContent, 'utf8');

    const signature = forge.pki.ed25519.sign({
      message: msgBuffer,
      privateKey: keypair.privateKey,
    });

    return {
      v: visaContent,
      k: kid,
      s: base64url(Buffer.from(signature)),
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
