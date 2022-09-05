import { Request, Response } from "express";
import * as solanaWeb3 from '@solana/web3.js';
import * as metaplex from '@metaplex/js';
import base58 from "bs58";
import nacl from "tweetnacl";
import { Metadata} from '@metaplex-foundation/mpl-token-metadata';
/**
 * GET /
 * Home page.
 */
export const index = async (req: Request, res: Response): Promise<void> => {
    res.render("index", { title: "Express" });
};

// disclaimer: this work is hacky to get it working
// normally, I'd have types for the request and response bodies 
// as well as validation and error handling
// probably also a solana service with helper methods for interacting with the chain  

export const getMetadata = async (req: Request, res: Response): Promise<void> => {
    let connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));
    const nftsMetadata = await Metadata.findDataByOwner(connection, req.body.ownerPubKey);
    // return metadata as response
    // in a production setting we'd want to paginate this probably
    res.send(nftsMetadata);
};

export const verifySignature = async (req: Request, res: Response): Promise<void> => {
    // given a message and a signature, verify that the signature is valid for the message
    // return true or false
    // get message, signature, and pubkey from request body
    const { message, signature, pubkey } = req.body;
    // decode the signature
    const decodedSignature = base58.decode(signature);
    // decode the pubkey
    const decodedPubkey = base58.decode(pubkey);
    // verify the signature
    const verified = nacl.sign.detached.verify(message, decodedSignature, decodedPubkey);
    // return the result
    res.send(verified);
};

export const verifySpl = async (req: Request, res: Response): Promise<void> => {
    const { transactionHash, amount, receivingWallet } = req.body;
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));
    const transaction = await connection.getParsedTransaction(transactionHash);
    const instructions = transaction?.transaction?.message?.instructions;
    // right now I think this might only work for NFT transfers
    // I had trouble finding a simple SPL transfer tx hash to test this on
    // but it might be that the uiTokenAmounts need to be parsed, similar to ethers.parseEther/formatEther for BigNumbers
    // but for NFT transfers the balance changes are 1, which is correct
    
    // compare the pre and post token balances, 
    // looking for the receiving wallet and correct amount change
    let balancesAndWalletsCorrect = false;
    for (let i = 0; i < transaction.meta.preTokenBalances.length; i++) {
        const preTokenBalance = transaction.meta.preTokenBalances[i];
        const postTokenBalance = transaction.meta.postTokenBalances[i];
        const preTokenAmount = preTokenBalance.uiTokenAmount.amount;
        const postTokenAmount = postTokenBalance.uiTokenAmount.amount;
        const preTokenOwner = preTokenBalance.owner;
        const postTokenOwner = postTokenBalance.owner;
        const delta = Number(postTokenAmount) - Number(preTokenAmount);
        if (preTokenOwner == receivingWallet && postTokenOwner == receivingWallet && delta == amount) {
            balancesAndWalletsCorrect = true;
        }
    }

    // this is probably redundant, hence commnenting out. 
    // let transferInstructionForAmountExists = false;
    // for (let i = 0; i < instructions.length; i++) {
    //     const instruction = instructions[i];
    //     if (instruction.parsed.type === 'transfer' && instruction.parsed.info.amount === amount) {
    //        transferInstructionForAmountExists = true;
    //     }
    // }
    // res.send(balancesAndWalletsCorrect && transferInstructionForAmountExists);
    res.send(balancesAndWalletsCorrect);
};