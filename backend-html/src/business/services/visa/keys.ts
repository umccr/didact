import { EdDsaJose } from './ed-dsa-jose';

// test definitions of keys
// (where possible using test keys from RFCs)
// obviously needs to be converted to getting keys from a secret store before production

export const keyDefinitions: { [kid: string]: EdDsaJose } = {
  // -----TEST 1
  // ALGORITHM:
  //    Ed25519
  // SECRET KEY:
  //    9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60
  // PUBLIC KEY:
  //    d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a
  // MESSAGE (length 0 bytes):
  // SIGNATURE:
  //    e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b
  'rfc8032-7.1-test1': {
    kty: 'OKP',
    crv: 'Ed25519',
    dHex: '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
  },
  // -----TEST 2
  //    ALGORITHM:
  //    Ed25519
  //    SECRET KEY:
  //    4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb
  //    PUBLIC KEY:
  //    3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c
  //    MESSAGE (length 1 byte):
  //    72
  //    SIGNATURE:
  //    92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00
  'rfc8032-7.1-test2': {
    kty: 'OKP',
    crv: 'Ed25519',
    dHex: '4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb',
  },
  // -----TEST 3
  //    ALGORITHM:
  //    Ed25519
  //    SECRET KEY:
  //    c5aa8df43f9f837bedb7442f31dcb7b166d38535076f094b85ce3a2e0b4458f7
  //    PUBLIC KEY:
  //    fc51cd8e6218a1a38da47ed00230f0580816ed13ba3303ac5deb911548908025
  //    MESSAGE (length 2 bytes):
  //    af82
  //    SIGNATURE:
  //    6291d657deec24024827e69c3abe01a30ce548a284743a445e3680d7db5ac3ac18ff9b538d16f290ae67f760984dc6594a7c15e9716ed28dc027beceea1ec40a
  'rfc8032-7.1-test3': {
    kty: 'OKP',
    crv: 'Ed25519',
    dHex: 'c5aa8df43f9f837bedb7442f31dcb7b166d38535076f094b85ce3a2e0b4458f7',
  },
  // -----TEST 1024
  //    ALGORITHM:
  //    Ed25519
  //    SECRET KEY:
  //    f5e5767cf153319517630f226876b86c8160cc583bc013744c6bf255f5cc0ee5
  //    PUBLIC KEY:
  //    278117fc144c72340f67d0f2316e8386ceffbf2b2428c9c51fef7c597f1d426e
  //    MESSAGE (length 1023 bytes):
  //    08b8b2b733424243760fe426a4b54908
  //     ... removed see RFC ...
  //    c60c905c15fc910840b94c00a0b9d0
  //    SIGNATURE:
  //    0aab4c900501b3e24d7cdf4663326a3a87df5e4843b2cbdb67cbf6e460fec350aa5371b1508f9f4528ecea23c436d94b5e8fcd4f681e30a6ac00a9704a188a03
  'rfc8032-7.1-test1024': {
    kty: 'OKP',
    crv: 'Ed25519',
    dHex: 'f5e5767cf153319517630f226876b86c8160cc583bc013744c6bf255f5cc0ee5',
  },
  // -----TEST SHA(abc)
  //
  //    ALGORITHM:
  //    Ed25519
  //
  //    SECRET KEY:
  //    833fe62409237b9d62ec77587520911e9a759cec1d19755b7da901b96dca3d42
  //
  //    PUBLIC KEY:
  //    ec172b93ad5e563bf4932c70e1245034c35467ef2efd4d64ebf819683467e2bf
  //
  //    MESSAGE (length 64 bytes):
  //    ddaf35a193617abacc417349ae204131
  //    12e6fa4e89a97ea20a9eeee64b55d39a
  //    2192992a274fc1a836ba3c23a3feebbd
  //    454d4423643ce80e2a9ac94fa54ca49f
  //
  //    SIGNATURE:
  //    dc2a4459e7369633a52b1bf277839a00
  //    201009a3efbf3ecb69bea2186c26b589
  //    09351fc9ac90b3ecfdfbc7c66431e030
  //    3dca179c138ac17ad9bef1177331a704
  'rfc8032-7.1-testSHA': {
    kty: 'OKP',
    crv: 'Ed25519',
    dHex: '833fe62409237b9d62ec77587520911e9a759cec1d19755b7da901b96dca3d42',
  },
  // -----Blank
  //    ALGORITHM:
  //    Ed448
  //    SECRET KEY:
  //    6c82a562cb808d10d632be89c8513ebf6c929f34ddfa8c9f63c9960ef6e348a3528c8a3fcc2f044e39a3fc5b94492f8f032e7549a20098f95b
  //    PUBLIC KEY:
  //    5fd7449b59b461fd2ce787ec616ad46a1da1342485a70e1f8a0ea75d80e96778edf124769b46c7061bd6783df1e50f6cd1fa1abeafe8256180
  //
  //    MESSAGE (length 0 bytes):
  //
  //    SIGNATURE:
  //    533a37f6bbe457251f023c0d88f976ae
  //    2dfb504a843e34d2074fd823d41a591f
  //    2b233f034f628281f2fd7a22ddd47d78
  //    28c59bd0a21bfd3980ff0d2028d4b18a
  //    9df63e006c5d1c2d345b925d8dc00b41
  //    04852db99ac5c7cdda8530a113a0f4db
  //    b61149f05a7363268c71d95808ff2e65
  //    2600
  /* 'rfc8032-7.4-testBlank': {
        'kty': 'OKP',
        'crv': 'Ed448',
        'dHex': '6c82a562cb808d10d632be89c8513ebf6c929f34ddfa8c9f63c9960ef6e348a3528c8a3fcc2f044e39a3fc5b94492f8f032e7549a20098f95b',
    }, */
  // -----1 octet
  //
  //    ALGORITHM:
  //    Ed448
  //
  //    SECRET KEY:
  //    c4eab05d357007c632f3dbb48489924d552b08fe0c353a0d4a1f00acda2c463afbea67c5e8d2877c5e3bc397a659949ef8021e954e0a12274e
  //
  //    PUBLIC KEY:
  //    43ba28f430cdff456ae531545f7ecd0a
  //    c834a55d9358c0372bfa0c6c6798c086
  //    6aea01eb00742802b8438ea4cb82169c
  //    235160627b4c3a9480
  //
  //    MESSAGE (length 1 byte):
  //    03
  //
  //    SIGNATURE:
  //    26b8f91727bd62897af15e41eb43c377
  //    efb9c610d48f2335cb0bd0087810f435
  //    2541b143c4b981b7e18f62de8ccdf633
  //    fc1bf037ab7cd779805e0dbcc0aae1cb
  //    cee1afb2e027df36bc04dcecbf154336
  //    c19f0af7e0a6472905e799f1953d2a0f
  //    f3348ab21aa4adafd1d234441cf807c0
  //    3a00
  /* 'rfc8032-7.4-test1Octet': {
        'kty': 'OKP',
        'crv': 'Ed448',
        'dHex': 'c4eab05d357007c632f3dbb48489924d552b08fe0c353a0d4a1f00acda2c463afbea67c5e8d2877c5e3bc397a659949ef8021e954e0a12274e',
    }, */
  // FROM A REAL PEM GENERATED BY OPENSSL
  // -----BEGIN PRIVATE KEY-----
  // MC4CAQAwBQYDK2VwBCIEIMXUAkML+TO0UhnE3XhunWyhSJ3YBfuhcp3zyhn/XD5C
  // -----END PRIVATE KEY-----
  // /usr/local/opt/openssl@1.1/bin/openssl asn1parse -in ed25519key.pem -offset 14
  //     0:d=0  hl=2 l=  32 prim: OCTET STRING      [HEX DUMP]:C5D402430BF933B45219C4DD786E9D6CA1489DD805FBA1729DF3CA19FF5C3E42
  'patto-kid1': {
    kty: 'OKP',
    crv: 'Ed25519',
    dHex: 'C5D402430BF933B45219C4DD786E9D6CA1489DD805FBA1729DF3CA19FF5C3E42',
  },
  // FROM A REAL PEM GENERATED BY OPENSSL
  // -----BEGIN PRIVATE KEY-----
  // MC4CAQAwBQYDK2VwBCIEID59I70n1xVW7Tp3m5cS5ueJ/Yj4PEsNbUppgRmm/E0C
  // -----END PRIVATE KEY-----
  // /usr/local/opt/openssl@1.1/bin/openssl asn1parse -in ed25519key2.pem -offset 14
  //     0:d=0  hl=2 l=  32 prim: OCTET STRING      [HEX DUMP]:3E7D23BD27D71556ED3A779B9712E6E789FD88F83C4B0D6D4A698119A6FC4D02
  'patto-kid2': {
    kty: 'OKP',
    crv: 'Ed25519',
    dHex: '3E7D23BD27D71556ED3A779B9712E6E789FD88F83C4B0D6D4A698119A6FC4D02',
  },
};
