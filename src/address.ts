import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import BIP32Factory from "bip32";

const bip32 = BIP32Factory(ecc);

export function CreateAddress(params: any): any {
  const { seedHex, receive0rchange, addressIndex, network, method } = params;
  const root = bip32.fromSeed(Buffer.from(seedHex, "hex"));
  let path = "m/44'/0'/0'/0/" + addressIndex + "";
  if (receive0rchange === 1) {
    path = "m/44'/0'/0'/1/" + addressIndex + "";
  }
  const child = root.derivePath(path);
  let address: string = "";
  switch (method) {
    case "p2pkh":
      const p2pkh = bitcoin.payments.p2pkh({
        pubkey: child.publicKey,
        network: bitcoin.networks[network],
      });
      address = p2pkh.address || "";
      break;
    case "p2wpkh":
      // eslint-disable-next-line no-case-declarations
      const p2wpkhAddress = bitcoin.payments.p2wpkh({
        pubkey: child.publicKey,
        network: bitcoin.networks[network],
      });
      address = p2wpkhAddress.address || "";
      break;
    case "p2sh":
      // eslint-disable-next-line no-case-declarations
      const p2shAddress = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({
          pubkey: child.publicKey,
          network: bitcoin.networks[network],
        }),
      });
      address = p2shAddress.address || "";
      break;
    default:
      console.log("This way can not support");
  }

  return {
    privateKey: child.privateKey
      ? Buffer.from(child.privateKey).toString("hex")
      : "",
    publicKey: Buffer.from(child.publicKey).toString("hex"),
    address,
  };
}

export function CreateMultisignAddress(params: any): string {
  const { pubkeys, network, method, threshold } = params;
  switch (method) {
    case "p2pkh":
      const p2shAddress = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2ms({
          m: threshold,
          network: bitcoin.networks[network],
          pubkeys,
        }),
      }).address;
      if (!p2shAddress) throw new Error('Failed to generate p2sh address');
      return p2shAddress;
    case "p2wpkh":
      const p2wshAddress = bitcoin.payments.p2wsh({
        redeem: bitcoin.payments.p2ms({
          m: threshold,
          network: bitcoin.networks[network],
          pubkeys,
        }),
      }).address;
      if (!p2wshAddress) throw new Error('Failed to generate p2wsh address');
      return p2wshAddress;
    case "p2sh":
      const p2shWshAddress = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wsh({
          redeem: bitcoin.payments.p2ms({
            m: threshold,
            network: bitcoin.networks[network],
            pubkeys,
          }),
        }),
      }).address;
      if (!p2shWshAddress) throw new Error('Failed to generate p2sh-p2wsh address');
      return p2shWshAddress;
    default:
      console.log("This way can not support");
      return "0x00";
  }
}

export function CreateSchnorrAddress (params: any): any {
  bitcoin.initEccLib(ecc);
  const { seedHex, receiveOrChange, addressIndex } = params;
  const root = bip32.fromSeed(Buffer.from(seedHex, 'hex'));
  let path = "m/44'/0'/0'/0/" + addressIndex + '';
  if (receiveOrChange === '1') {
    path = "m/44'/0'/0'/1/" + addressIndex + '';
  }
  const childKey = root.derivePath(path);
  const privateKey = childKey.privateKey;
  if (!privateKey) throw new Error('No private key found');

  const publicKey = childKey.publicKey;

  // 生成 P2TR 地址
  const { address } = bitcoin.payments.p2tr({
    internalPubkey: publicKey.length === 32 ? publicKey : publicKey.slice(1, 33)
  });

  return {
    privateKey: Buffer.from(childKey.privateKey!).toString('hex'),
    publicKey: Buffer.from(childKey.publicKey).toString('hex'),
    address
  };
}