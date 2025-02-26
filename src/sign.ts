import * as ecc from "tiny-secp256k1";
import BIP32Factory from "bip32";
import * as bitcoin from "bitcoinjs-lib";
import bitcore from "bitcore-lib";
BIP32Factory(ecc);

export function buildAndSignTx(params: {
  privatekey: string;
  signObj: any;
  network: string;
}): string {
  const { privatekey, signObj, network } = params;
  const net = bitcore.Networks.get(network);
  const input = signObj.input.map((input) => {
    return {
      address: input.address,
      txid: input.txid,
      outputIndex: input.vout,
      script: new bitcore.script.fromHex(input.address).toHex(),
      satoshis: input.amount,
    };
  });
  const outputs = signObj.outputs.map((output) => {
    return {
      address: output.address,
      satoshis: output.amount,
    };
  });
  const transaction = new bitcore.transaction(net).from(input).to(outputs);
  transaction.version = 2;
  transaction.sign(privatekey);
  return transaction.toString();
}

/**
 * 构建并签名比特币交易
 * @param params 交易参数
 * @param params.privatekey 私钥
 * @param params.signObj 交易输入输出对象
 * @param params.network 网络类型
 * @returns 签名后的交易十六进制字符串
 */


export function buildUnsignedTx(params) {
  const { keypairs, signObj, network } = params;
  const psbt = new bitcoin.Psbt({ network });
  const inputs = signObj.inputs.map((input) => {
    return {
      address: input.address,
      txId: input.txid,
      outputIndex: input.vout,
      // eslint-disable-next-line new-cap
      script: new bitcore.Script.fromAddress(input.address).toHex(),
      satoshis: input.amount,
    };
  });
  psbt.addInput(inputs);

  const outputs = signObj.outputs.map((output) => {
    return {
      address: output.address,
      satoshis: output.amount,
    };
  });

  psbt.addOutput(outputs);
  psbt.toBase64();

  psbt.signInput(0, keypairs);
  psbt.finalizeAllInputs();

  const signedTransaction = psbt.extractTransaction().toHex();
  console.log("signedTransaction == ", signedTransaction);
}
