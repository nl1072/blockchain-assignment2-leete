import { artifacts } from "hardhat";
import { createPublicClient, http, decodeEventLog } from "viem";
//const { ethers } = require("hardhat");


const RPC_URL = process.env.RPC_URL!;
const CHAIN_ID = Number(process.env.CHAIN_ID!);
// Paste from interact output
const HASHES = {
    tx1: "0x2e10d011879ec4e0be8689a8cbf6d3322cfee3306a35465b08ad5d8e7b4c328f",
    tx2: "0xcd6958c8600dd3178d34fbfe1116374d51a2cc92df068bec6936236293c08fd4",
    tx3: "0x22546c9843136e3a1e2bc33f42f04efaa8cfb827994d569b12adbe931a84e421",
};

/*
const iface = new ethers.Interface([
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
]);
*/

async function analyze(hash: `0x${string}`, abi: any) {
    const chain = {
        id: CHAIN_ID, name: `didlab-${CHAIN_ID}`, nativeCurrency: {
            name:
                "ETH", symbol: "ETH", decimals: 18
        }, rpcUrls: { default: { http: [RPC_URL] } }
    };
    const pc = createPublicClient({ chain, transport: http(RPC_URL) });
    const tx = await pc.getTransaction({ hash });
    const rcpt = await pc.getTransactionReceipt({ hash });
    const block = await pc.getBlock({ blockNumber: rcpt.blockNumber });
    const baseFee = block.baseFeePerGas ?? 0n;
    const gasUsed = rcpt.gasUsed ?? 0n;
    const effective = rcpt.effectiveGasPrice ?? tx.gasPrice ?? 0n;
    const totalFee = gasUsed * effective;
    console.log(`\n=== ${hash} ===`);
    console.log("Status:", rcpt.status === "success" ? "Success" : "Fail");
    console.log("Block:", rcpt.blockNumber);
    console.log("Timestamp (UTC):", new Date(Number(block.timestamp) * 1000).toISOString());
    console.log("From:", tx.from);
    console.log("To:", tx.to);
    console.log("Nonce:", tx.nonce);
    console.log("Gas limit:", tx.gas);
    console.log("Gas used:", gasUsed);
    console.log("Base fee per gas:", baseFee);
    console.log("Max fee per gas:", tx.maxFeePerGas ?? 0n);
    console.log("Max priority fee per gas:", tx.maxPriorityFeePerGas ?? 0n);
    console.log("Effective gas price:", effective);
    console.log("Total fee (wei):", totalFee);
    /*
    for (const log of rcpt.logs) {
        try {
            const parsed = ethers.parseLog({ topics: log.topics, data: log.data });
            //const parsed = decodeEventLog({ abi, data: log.data, topics: log.topics });
            console.log("Event:", parsed.eventName, parsed.args);
        } catch { \/\* not a CampusCredit event \*\/ }
    }
    */
}
async function main() {
    const { abi } = await artifacts.readArtifact("CampusCredit");
    await analyze(HASHES.tx1 as `0x${string}`, abi);
    await analyze(HASHES.tx2 as `0x${string}`, abi);
    await analyze(HASHES.tx3 as `0x${string}`, abi);
}
main().catch((e) => { console.error(e); process.exit(1); });