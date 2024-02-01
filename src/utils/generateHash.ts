import { createHash } from "crypto";

/**
 * Create hash on based datas
 * @param {data} string data for hash
 * @returns hash string
 */
function generateHash(data: string): string {
  return createHash("sha256").update(data).digest().toString("base64");
}
export default generateHash;
