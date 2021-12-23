/**
 * This module is responsible for interacting with stacks -
 * deploying contracts, calling contraact methods, and more!
 *
 * Note: this module is intentionally messy because it will probably be
 * ripped out in favor of Etherium at some point.
 */
import { TransactionVersion, stringAsciiCV, standardPrincipalCV, cvToValue, callReadOnlyFunction, makeContractCall, broadcastTransaction, AnchorMode, FungibleConditionCode, makeStandardSTXPostCondition, bufferCVFromString, intCV, uintCV } from "@stacks/transactions";
import { StacksTestnet, StacksMainnet } from "@stacks/network";
import { getStxAddress, generateWallet, generateSecretKey } from "@stacks/wallet-sdk";
import { Principal } from "~/generated/graphql-schema";

// The contract address and name for MultiNftOne.
const nftContractAddress = "ST15R1FRG7ZB6D48RD1SDPP6KZ6RTF47AQQZWMC91";
const nftContractName = "MultiNftOne";

/** Creates a new Principal for a user. */
export async function createPrincipal(password: string) {
  const secretKey = generateSecretKey();

  const wallet = await generateWallet({
    secretKey: secretKey,
    password: password,
  });

  const publicAddress = getStxAddress({
    account: wallet.accounts[0],
    transactionVersion: TransactionVersion.Testnet,
  });

  const stxPrivateKey = wallet.accounts[0].stxPrivateKey;

  const principal: Omit<Principal, "user" | "nfts"> = {
    publicAddress: publicAddress,
    secretKey: secretKey,
    password: password,
    stxPrivateKey: stxPrivateKey,
  };

  return principal;
}

/**
 * Creates a new MultiNft nft class.
 */
export async function createNftClass(principal: Principal, title: string) {

  const network = new StacksTestnet();

  const txOptions = {
    contractAddress: nftContractAddress,
    contractName: nftContractName,
    functionName: "create-class",
    functionArgs: [stringAsciiCV(title)],
    senderKey: principal.stxPrivateKey,
    validateWithAbi: true,
    network: network,
    anchorMode: AnchorMode.Any,
  };

  console.log("Attempting create-class with principal", principal);

  const transaction = await makeContractCall(txOptions);
  console.log(transaction);

  const broadcastResponse = await broadcastTransaction(transaction, network);

  return broadcastResponse;

}

/**
 * Creates a new MultiNft nft class.
 */
export async function createNft(classId: number, uri: string, principal: Principal) {

  const network = new StacksTestnet();

  const txOptions = {
    contractAddress: nftContractAddress,
    contractName: nftContractName,
    functionName: "create-nft",
    functionArgs: [uintCV(classId), stringAsciiCV(uri), standardPrincipalCV(principal.publicAddress)],
    senderKey: principal.stxPrivateKey,
    validateWithAbi: true,
    network: network,
    anchorMode: AnchorMode.Any,
  };

  console.log("Attempting create-class with principal", principal);

  const transaction = await makeContractCall(txOptions);
  console.log(transaction);

  const broadcastResponse = await broadcastTransaction(transaction, network);

  return broadcastResponse;

}

// TODO: fix this
type ClarityValue = any

/**
 * Call any read-only method from the MultiNft contract.
 */
export async function readFromContract(principal: Principal, functionName: string, functionArgs: ClarityValue[]) {

  const network = new StacksTestnet();

  const options = {
    contractAddress: nftContractAddress,
    contractName: nftContractName,
    functionName: functionName,
    functionArgs: [],
    senderAddress: principal.publicAddress,
    network,
  };

  const result = await callReadOnlyFunction(options);
  console.log("res", result);
  console.log("res-val", cvToValue(result).value);

  return cvToValue(result).value;
}
