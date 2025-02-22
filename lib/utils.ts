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

export async function fetchLinkedInData(url: string, exa: Exa, retries = 0): Promise<any> {
  try {
    console.log(`Fetching LinkedIn data for ${url}, attempt ${retries + 1}`);
    const result = await exa.getContents(
      [url],
      {
        text: true
      }
    );

    console.log('LinkedIn API response:', result);

    if (!result.results?.[0]) {
      throw new Error('No LinkedIn data found');
    }

    return result.results[0];

  } catch (error) {
    console.error(`LinkedIn fetch error (attempt ${retries + 1}):`, error);
    if (retries < MAX_RETRIES) {
      await sleep(RETRY_DELAY);
      return fetchLinkedInData(url, exa, retries + 1);
    }
    throw error;
  }
}

export async function fetchWebsiteData(url: string, exa: Exa, retries = 0): Promise<any> {
  try {
    console.log(`Fetching website data for ${url}, attempt ${retries + 1}`);
    const result = await exa.getContents(
      [url],
      {
        text: true,
        ...(retries < 2 && { livecrawl: "always" })
      }
    );

    console.log('Website API response:', result);

    if (!result.results?.[0]) {
      throw new Error('No website data found');
    }

    return result.results[0];

  } catch (error) {
    console.error(`Website fetch error (attempt ${retries + 1}):`, error);
    if (retries < MAX_RETRIES) {
      await sleep(RETRY_DELAY);
      return fetchWebsiteData(url, exa, retries + 1);
    }
    throw error;
  }
}

export async function fetchOtherLinkData(url: string, exa: Exa, retries = 0): Promise<any> {
  try {
    const result = await exa.getContents(
      [url],
      {
        text: true,
        ...(retries < 2 && { livecrawl: "always" })
      }
    );

    if (!result.results?.[0]) {
      throw new Error(`No data found for ${url}`);
    }

    return result.results[0];

  } catch (error) {
    if (retries < MAX_RETRIES) {
      await sleep(RETRY_DELAY);
      return fetchOtherLinkData(url, exa, retries + 1);
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
