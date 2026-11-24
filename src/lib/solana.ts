import bs58 from 'bs58'
import { Buffer } from 'buffer/'
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'

export const SOLANA_NETWORK = 'devnet'
export const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
export const AIDEX_PROGRAM_ID = import.meta.env.VITE_AIDEX_PROGRAM_ID || 'JAC2dcscjDK6AhCrubUhve9w7ttiUg9zaBzpzFjMHWLh'

export interface BrowserWallet {
  publicKey?: PublicKey
  isConnected?: boolean
  connect: () => Promise<{ publicKey?: PublicKey } | void>
  disconnect?: () => Promise<void>
  signMessage?: (message: Uint8Array, encoding?: string) => Promise<{ signature: Uint8Array } | Uint8Array>
  signAndSendTransaction?: (transaction: Transaction) => Promise<{ signature: string } | string>
  signTransaction?: (transaction: Transaction) => Promise<Transaction>
}

declare global {
  interface Window {
    solana?: BrowserWallet & { isPhantom?: boolean }
    phantom?: { solana?: BrowserWallet }
    solflare?: BrowserWallet
  }
}

export type WalletChoice = 'phantom' | 'solflare'
const walletPreferenceKey = 'aidex.wallet-provider'

export function preferredWallet(): WalletChoice | undefined {
  if (typeof window === 'undefined') return
  const value = window.localStorage.getItem(walletPreferenceKey)
  if (value === 'phantom' || value === 'solflare') return value
}

export function rememberWallet(choice: WalletChoice | 'auto') {
  if (choice === 'auto') window.localStorage.removeItem(walletPreferenceKey)
  else window.localStorage.setItem(walletPreferenceKey, choice)
}

function walletProvider(choice: WalletChoice | 'auto' | undefined = preferredWallet()): BrowserWallet {
  const phantom = window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : undefined)
  const solflare = window.solflare
  if (choice === 'solflare') {
    if (!solflare) throw new Error('Install or enable Solflare in this browser, then refresh AIDEX.')
    return solflare
  }
  if (choice === 'phantom') {
    if (!phantom) throw new Error('Install or enable Phantom in this browser, then refresh AIDEX.')
    return phantom
  }
  const provider = phantom ?? solflare ?? window.solana
  if (!provider) throw new Error('Install Phantom or Solflare to use Solana Devnet')
  return provider
}

export async function connectWallet(choice?: WalletChoice | 'auto'): Promise<{ provider: BrowserWallet; publicKey: PublicKey }> {
  const provider = walletProvider(choice)
  const result = await provider.connect()
  const publicKey = result?.publicKey ?? provider.publicKey
  if (!publicKey) throw new Error('The wallet did not return a public key')
  return { provider, publicKey: new PublicKey(publicKey.toString()) }
}

export async function signWalletLink(userId: string, choice?: WalletChoice | 'auto'): Promise<{
  walletAddress: string
  signedAt: string
  signature: string
}> {
  const { provider, publicKey } = await connectWallet(choice)
  if (!provider.signMessage) throw new Error('This wallet does not support message signing')
  const walletAddress = publicKey.toBase58()
  const signedAt = new Date().toISOString()
  const message = new TextEncoder().encode(
    `AIDEX wallet link\nUser: ${userId}\nWallet: ${walletAddress}\nSigned at: ${signedAt}`,
  )
  const signed = await provider.signMessage(message, 'utf8')
  const signature = signed instanceof Uint8Array ? signed : signed.signature
  return { walletAddress, signedAt, signature: bs58.encode(signature) }
}

export function explorerTransaction(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`
}

export function explorerAddress(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`
}

async function sha256(value: Uint8Array): Promise<Uint8Array> {
  const input = Uint8Array.from(value).buffer
  return new Uint8Array(await crypto.subtle.digest('SHA-256', input))
}

async function discriminator(name: string): Promise<Uint8Array> {
  return (await sha256(new TextEncoder().encode(`global:${name}`))).slice(0, 8)
}

function u64(value: bigint): Uint8Array {
  const bytes = new Uint8Array(8)
  new DataView(bytes.buffer).setBigUint64(0, value, true)
  return bytes
}

function i64(value: bigint): Uint8Array {
  const bytes = new Uint8Array(8)
  new DataView(bytes.buffer).setBigInt64(0, value, true)
  return bytes
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(arrays.reduce((sum, item) => sum + item.length, 0))
  let offset = 0
  for (const array of arrays) {
    result.set(array, offset)
    offset += array.length
  }
  return result
}

function programId(): PublicKey {
  if (AIDEX_PROGRAM_ID === SystemProgram.programId.toBase58()) {
    throw new Error('The AIDEX Devnet program has not been deployed yet')
  }
  return new PublicKey(AIDEX_PROGRAM_ID)
}

async function assertEscrowReady(escrow: PublicKey): Promise<void> {
  const connection = new Connection(SOLANA_RPC_URL, 'confirmed')
  const program = programId()
  const [programAccount, escrowAccount] = await Promise.all([
    connection.getAccountInfo(program, 'confirmed'),
    connection.getAccountInfo(escrow, 'confirmed'),
  ])
  if (!programAccount?.executable) {
    throw new Error('The AIDEX escrow program is not deployed on Solana Devnet yet. Fund the deployment wallet and deploy the program before accepting donations.')
  }
  if (!escrowAccount?.owner.equals(program)) {
    throw new Error('This campaign escrow has not been initialized on Solana Devnet yet. An NGO administrator must activate it before donors can deposit.')
  }
}

export async function campaignSeed(campaignId: string): Promise<Uint8Array> {
  return sha256(new TextEncoder().encode(campaignId))
}

export async function campaignPda(campaignId: string): Promise<PublicKey> {
  const seed = await campaignSeed(campaignId)
  return PublicKey.findProgramAddressSync([new TextEncoder().encode('campaign'), seed], programId())[0]
}

export function milestonePda(escrow: PublicKey, index: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode('milestone'), escrow.toBytes(), Uint8Array.of(index)],
    programId(),
  )[0]
}

export function receiptPda(escrow: PublicKey, donor: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode('receipt'), escrow.toBytes(), donor.toBytes()],
    programId(),
  )[0]
}

async function sendInstructions(provider: BrowserWallet, payer: PublicKey, instructions: TransactionInstruction[], onSubmitted?: (signature: string) => void) {
  const connection = new Connection(SOLANA_RPC_URL, 'confirmed')
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  const transaction = new Transaction({ feePayer: payer, recentBlockhash: blockhash }).add(...instructions)
  let signature: string
  if (provider.signAndSendTransaction) {
    const result = await provider.signAndSendTransaction(transaction)
    signature = typeof result === 'string' ? result : result.signature
  } else if (provider.signTransaction) {
    const signed = await provider.signTransaction(transaction)
    signature = await connection.sendRawTransaction(signed.serialize(), { maxRetries: 3 })
  } else {
    throw new Error('This wallet cannot sign Solana transactions')
  }
  onSubmitted?.(signature)
  const confirmation = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')
  if (confirmation.value.err) throw new Error('Solana rejected the transaction. Check its status in Explorer.')
  return signature
}

async function instruction(
  name: string,
  keys: ConstructorParameters<typeof TransactionInstruction>[0]['keys'],
  args: Uint8Array = new Uint8Array(),
): Promise<TransactionInstruction> {
  return new TransactionInstruction({
    programId: programId(),
    keys,
    data: Buffer.from(concat(await discriminator(name), args)),
  })
}

export async function initializeCampaignEscrow(input: {
  campaignId: string
  verifierWallets: string[]
  goalLamports: bigint
  refundDeadline: Date
  milestoneLamports: bigint[]
}): Promise<{ escrowPda: string; programId: string; txSignature: string; allSignatures: string[] }> {
  if (input.verifierWallets.length !== 3) throw new Error('Exactly three verifier wallets are required')
  const { provider, publicKey: authority } = await connectWallet()
  const program = programId()
  const seed = await campaignSeed(input.campaignId)
  const escrow = PublicKey.findProgramAddressSync([new TextEncoder().encode('campaign'), seed], program)[0]
  const verifierBytes = input.verifierWallets.map((value) => new PublicKey(value).toBytes())
  const initialize = await instruction(
    'initialize_campaign',
    [
      { pubkey: escrow, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    concat(seed, ...verifierBytes, u64(input.goalLamports), i64(BigInt(Math.floor(input.refundDeadline.getTime() / 1000)))),
  )
  const signatures = [await sendInstructions(provider, authority, [initialize])]
  for (let index = 0; index < input.milestoneLamports.length; index += 1) {
    const milestone = milestonePda(escrow, index)
    const addMilestone = await instruction(
      'add_milestone',
      [
        { pubkey: escrow, isSigner: false, isWritable: true },
        { pubkey: milestone, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      concat(Uint8Array.of(index), u64(input.milestoneLamports[index])),
    )
    signatures.push(await sendInstructions(provider, authority, [addMilestone]))
  }
  const seal = await instruction('seal_campaign', [
    { pubkey: escrow, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: true, isWritable: false },
  ])
  signatures.push(await sendInstructions(provider, authority, [seal]))
  return {
    escrowPda: escrow.toBase58(),
    programId: program.toBase58(),
    txSignature: signatures[signatures.length - 1],
    allSignatures: signatures,
  }
}

export async function depositToEscrow(
  escrowAddress: string,
  amountLamports: bigint,
  linkedWallet: string,
  onStage: (stage: 'wallet' | 'confirming', signature?: string) => void,
) {
  if (amountLamports <= 0n) throw new Error('Donation amount must be greater than zero')
  const escrow = new PublicKey(escrowAddress)
  await assertEscrowReady(escrow)
  onStage('wallet')
  const { provider, publicKey: donor } = await connectWallet()
  if (donor.toBase58() !== linkedWallet) throw new Error('Switch your wallet to the account linked in AIDEX Settings.')
  const receipt = receiptPda(escrow, donor)
  const deposit = await instruction(
    'deposit',
    [
      { pubkey: escrow, isSigner: false, isWritable: true },
      { pubkey: receipt, isSigner: false, isWritable: true },
      { pubkey: donor, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    u64(amountLamports),
  )
  const signature = await sendInstructions(provider, donor, [deposit], (submitted) => onStage('confirming', submitted))
  return { signature, walletAddress: donor.toBase58(), receipt: receipt.toBase58() }
}

export async function submitEvidenceHash(escrowAddress: string, index: number, hashHex: string) {
  const { provider, publicKey: ngo } = await connectWallet()
  const escrow = new PublicKey(escrowAddress)
  const milestone = milestonePda(escrow, index)
  const hash = Uint8Array.from(hashHex.match(/.{2}/g)?.map((part) => Number.parseInt(part, 16)) ?? [])
  if (hash.length !== 32) throw new Error('Evidence manifest hash must be SHA-256')
  const ix = await instruction(
    'submit_evidence',
    [
      { pubkey: escrow, isSigner: false, isWritable: false },
      { pubkey: milestone, isSigner: false, isWritable: true },
      { pubkey: ngo, isSigner: true, isWritable: false },
    ],
    concat(Uint8Array.of(index), hash),
  )
  return sendInstructions(provider, ngo, [ix])
}

export async function voteOnMilestone(escrowAddress: string, index: number, approve: boolean) {
  const { provider, publicKey: verifier } = await connectWallet()
  const escrow = new PublicKey(escrowAddress)
  const milestone = milestonePda(escrow, index)
  const ix = await instruction(
    'vote',
    [
      { pubkey: escrow, isSigner: false, isWritable: false },
      { pubkey: milestone, isSigner: false, isWritable: true },
      { pubkey: verifier, isSigner: true, isWritable: false },
    ],
    Uint8Array.of(index, approve ? 1 : 0),
  )
  return sendInstructions(provider, verifier, [ix])
}

export async function releaseMilestone(escrowAddress: string, ngoAddress: string, index: number) {
  const { provider, publicKey: caller } = await connectWallet()
  const escrow = new PublicKey(escrowAddress)
  const milestone = milestonePda(escrow, index)
  const ix = await instruction(
    'release',
    [
      { pubkey: escrow, isSigner: false, isWritable: true },
      { pubkey: milestone, isSigner: false, isWritable: true },
      { pubkey: new PublicKey(ngoAddress), isSigner: false, isWritable: true },
      { pubkey: caller, isSigner: true, isWritable: false },
    ],
    Uint8Array.of(index),
  )
  return sendInstructions(provider, caller, [ix])
}

export async function fileSha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function evidenceManifestSha256(items: Array<{ fileName: string; sha256: string; description: string }>) {
  const canonical = [...items]
    .sort((a, b) => a.fileName.localeCompare(b.fileName))
    .map((item) => `${item.fileName}\n${item.sha256}\n${item.description.trim()}`)
    .join('\n---\n')
  const digest = await sha256(new TextEncoder().encode(canonical))
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
