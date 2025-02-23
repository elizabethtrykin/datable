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

    console.log('Raw Twitter Data Structure:', JSON.stringify(result.results[0], null, 2));
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

    if (!result.results?.[0]) {
      throw new Error('No LinkedIn data found');
    }

    console.log('Raw LinkedIn Data Structure:', JSON.stringify(result.results[0], null, 2));
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

    if (!result.results?.[0]) {
      throw new Error('No website data found');
    }

    console.log('Raw Website Data Structure:', JSON.stringify(result.results[0], null, 2));
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

    console.log('Raw Other Link Data Structure:', JSON.stringify(result.results[0], null, 2));
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

interface CleanedTwitterData {
  handle?: string;
  bio?: string;
  location?: string;
  followerCount?: number;
  followingCount?: number;
  tweetCount?: number;
  tweets?: Array<{
    text: string;
    favorites: number;
    retweets: number;
    date: string;
  }>;
}

interface CleanedLinkedInData {
  currentRole?: string;
  location?: string;
  connections?: string;
  experiences?: string[];
  education?: string[];
  languages?: string[];
}

interface CleanedWebsiteData {
  title?: string;
  content?: string;
}

function cleanTwitterData(data: any): CleanedTwitterData {
  if (!data?.text) return {};
  
  const text = data.text;
  
  // Extract profile info (everything before the first tweet)
  const [profileInfo, ...tweetTexts] = text.split('| created_at:');
  const profileParts = profileInfo.split('|');
  const bio = profileParts[0].trim();
  
  // Parse profile metadata
  const matches = {
    followers: text.match(/followers_count: (\d+)/),
    following: text.match(/friends_count: (\d+)/),
    tweets: text.match(/statuses_count: (\d+)/),
    location: text.match(/location: ([^|]+)/)
  };

  // Parse tweets
  const tweets = tweetTexts.map((tweetText: string) => {
    const dateMatch = tweetText.match(/^([^|]+)/);
    const favMatch = tweetText.match(/favorite_count: (\d+)/);
    const rtMatch = tweetText.match(/retweet_count: (\d+)/);
    const contentMatch = tweetText.match(/count: \d+\s*\|\s*lang: \w+\s+([^|]+)/);

    return {
      date: dateMatch ? dateMatch[1].trim() : '',
      text: contentMatch ? contentMatch[1].trim() : '',
      favorites: favMatch ? parseInt(favMatch[1]) : 0,
      retweets: rtMatch ? parseInt(rtMatch[1]) : 0
    };
  }).filter((tweet: { text: string }) => tweet.text); // Only keep tweets with content

  return {
    handle: data.author,
    bio,
    location: matches.location ? matches.location[1].trim() : undefined,
    followerCount: matches.followers ? parseInt(matches.followers[1]) : undefined,
    followingCount: matches.following ? parseInt(matches.following[1]) : undefined,
    tweetCount: matches.tweets ? parseInt(matches.tweets[1]) : undefined,
    tweets
  };
}

function cleanLinkedInData(data: any): CleanedLinkedInData {
  if (!data?.text) return {};

  const text = data.text;
  const lines = text.split('\n');
  
  // Parse experiences
  const experiences = [];
  let inExperiences = false;
  for (const line of lines) {
    if (line.startsWith('Experiences:')) {
      inExperiences = true;
      continue;
    } else if (inExperiences && line.startsWith('Education:')) {
      break;
    } else if (inExperiences) {
      experiences.push(line.trim());
    }
  }

  // Parse education
  const education = [];
  const eduMatch = text.match(/Education:[\s\S]*?(?=Languages:|$)/);
  if (eduMatch) {
    const eduText = eduMatch[0].replace('Education:', '').trim();
    education.push(eduText);
  }

  // Parse languages
  const languages = [];
  const langMatches = text.matchAll(/language: (.*?)\nproficiency: (.*?)(?=\n|$)/g);
  for (const match of langMatches) {
    languages.push(`${match[1]} (${match[2]})`);
  }

  return {
    currentRole: text.match(/Position: (.*?)(?=\n|$)/)?.[1],
    location: text.match(/Location: (.*?)(?=\n|$)/)?.[1],
    connections: text.match(/Number of connections: (.*?)(?=\n|$)/)?.[1],
    experiences: experiences.filter(Boolean),
    education: education.filter(Boolean),
    languages: languages
  };
}

function cleanWebsiteData(data: any): CleanedWebsiteData {
  if (!data) return {};

  return {
    title: data.title,
    content: data.text?.trim()
  };
}

export function formatProfileData(profileData: any): string {
  const {
    twitter_data,
    linkedin_data,
    website_data,
    other_links_data,
    gender,
    twitter_handle,
    linkedin_url,
    personal_website,
    other_links
  } = profileData;

  const cleanedTwitter = cleanTwitterData(twitter_data);
  const cleanedLinkedIn = cleanLinkedInData(linkedin_data);
  const cleanedWebsite = cleanWebsiteData(website_data);

  const sections = [];

  // Basic Info
  sections.push(`Profile Type: ${gender}`);
  
  // Twitter Section
  if (twitter_handle) {
    sections.push('\nTwitter Profile:');
    sections.push(`Handle: @${cleanedTwitter.handle || twitter_handle}`);
    if (cleanedTwitter.bio) sections.push(`Bio: ${cleanedTwitter.bio}`);
    if (cleanedTwitter.location) sections.push(`Location: ${cleanedTwitter.location}`);
    if (cleanedTwitter.followerCount) sections.push(`Followers: ${cleanedTwitter.followerCount}`);
    if (cleanedTwitter.tweetCount) sections.push(`Total Tweets: ${cleanedTwitter.tweetCount}`);
    
    if (cleanedTwitter.tweets?.length) {
      sections.push('\nRecent Popular Tweets:');
      cleanedTwitter.tweets.forEach(tweet => {
        sections.push(`- ${tweet.text}`);
        sections.push(`  ${tweet.favorites} likes • ${tweet.retweets} retweets • ${tweet.date}`);
      });
    }
  }

  // LinkedIn Section
  if (linkedin_url) {
    sections.push('\nProfessional Background:');
    if (cleanedLinkedIn.currentRole) sections.push(`Current Role: ${cleanedLinkedIn.currentRole}`);
    if (cleanedLinkedIn.location) sections.push(`Location: ${cleanedLinkedIn.location}`);
    if (cleanedLinkedIn.connections) sections.push(`Network: ${cleanedLinkedIn.connections}`);
    if (cleanedLinkedIn.experiences?.length) {
      sections.push('Experience:');
      cleanedLinkedIn.experiences.forEach(exp => sections.push(`- ${exp}`));
    }
    if (cleanedLinkedIn.education?.length) {
      sections.push('Education:');
      cleanedLinkedIn.education.forEach(edu => sections.push(`- ${edu}`));
    }
    if (cleanedLinkedIn.languages?.length) {
      sections.push('Languages:');
      cleanedLinkedIn.languages.forEach(lang => sections.push(`- ${lang}`));
    }
  }

  // Personal Website Section
  if (personal_website) {
    sections.push('\nPersonal Website:');
    sections.push(`URL: ${personal_website}`);
    if (cleanedWebsite.title) sections.push(`Title: ${cleanedWebsite.title}`);
    if (cleanedWebsite.content) sections.push(`Content:\n${cleanedWebsite.content}`);
  }

  // Other Links Section
  if (other_links?.length) {
    sections.push('\nOther Online Presence:');
    other_links.forEach((link: string, index: number) => {
      sections.push(`Link ${index + 1}: ${link}`);
      const linkData = other_links_data?.[index];
      if (linkData?.text) sections.push(`Content: ${linkData.text.trim()}`);
    });
  }

  return sections.join('\n');
}
