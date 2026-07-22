// Exact content identity — the value stored in media.file_hash and enforced
// by the (event_id, guest_token, file_hash) unique index. Byte-identical
// files and only byte-identical files produce the same value, so burst shots
// and similar compositions never false-positive as duplicates.
export async function getFileContentHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}
