import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import Exa from 'exa-js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchTwitterData(handle: string, exa: Exa, retries = 0): Promise<any> {
  try {
    const result = await exa.getContents(
      [`https://x.com/${handle}`],
      {
        text: true,
        ...(retries < 2 && { livecrawl: "always" })
      }
    );

    if (!result.results?.[0]) {
      throw new Error('No Twitter data found');
    }

    return result.results[0];

  } catch (error) {
    if (retries < MAX_RETRIES) {
      await sleep(RETRY_DELAY);
      return fetchTwitterData(handle, exa, retries + 1);
    }
    throw error;
  }
}

export function isValidTwitterHandle(handle: string): boolean {
  return /^[A-Za-z0-9_]{1,15}$/.test(handle);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
