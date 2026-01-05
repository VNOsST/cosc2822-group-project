/**
 * S3 Image Storage Client
 * Handles uploading movie images to S3 bucket
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

// Configuration
const isLocalDevelopment = process.env.NODE_ENV === "development" || !process.env.AWS_REGION;
const S3_BUCKET = process.env.MOVIES_IMAGES_BUCKET || "cinecloud-movie-images";
const S3_REGION = process.env.AWS_REGION || "ap-southeast-2";

// For local development, we can use LocalStack or skip S3 uploads
const s3Client = new S3Client({
  region: S3_REGION,
  ...(isLocalDevelopment && process.env.S3_ENDPOINT
    ? {
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
        },
      }
    : {}),
});

export interface UploadResult {
  key: string;
  url: string;
}

/**
 * Check if an image already exists in S3
 */
async function imageExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Download image from URL and upload to S3
 */
export async function uploadImageToS3(
  imageUrl: string,
  tmdbId: string,
  imageType: "poster" | "backdrop",
  index = 0,
): Promise<UploadResult | null> {
  // Skip if no URL or placeholder
  if (!imageUrl || imageUrl.includes("placeholder")) {
    return null;
  }

  // Skip S3 upload in local development if no S3 endpoint configured
  if (isLocalDevelopment && !process.env.S3_ENDPOINT) {
    console.log(`[s3-storage] Skipping S3 upload in local dev: ${imageUrl}`);
    return {
      key: `movies/${tmdbId}/${imageType}-${index}.jpg`,
      url: imageUrl, // Return original URL in local dev
    };
  }

  try {
    // Generate S3 key
    const extension = imageUrl.split(".").pop()?.split("?")[0] || "jpg";
    const key = `movies/${tmdbId}/${imageType}-${index}.${extension}`;

    // Check if already uploaded
    if (await imageExists(key)) {
      console.log(`[s3-storage] Image already exists: ${key}`);
      return {
        key,
        url: getS3Url(key),
      };
    }

    // Download image from TMDB
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: Buffer.from(imageBuffer),
        ContentType: contentType,
        CacheControl: "public, max-age=31536000", // 1 year cache
        Metadata: {
          "tmdb-id": tmdbId,
          "image-type": imageType,
          "original-url": imageUrl,
        },
      }),
    );

    console.log(`[s3-storage] Uploaded image: ${key}`);

    return {
      key,
      url: getS3Url(key),
    };
  } catch (error) {
    console.error(`[s3-storage] Error uploading image:`, error);
    return null;
  }
}

/**
 * Upload multiple images to S3
 */
export async function uploadImagesToS3(
  imageUrls: string[],
  tmdbId: string,
  imageType: "poster" | "backdrop",
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const result = await uploadImageToS3(imageUrls[i], tmdbId, imageType, i);
    if (result) {
      results.push(result.url);
    }
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Get the public S3 URL for an image
 */
export function getS3Url(key: string): string {
  // Use CloudFront URL if configured, otherwise S3 URL
  const cdnDomain = process.env.CDN_DOMAIN;
  if (cdnDomain) {
    return `https://${cdnDomain}/${key}`;
  }
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

/**
 * Get the S3 bucket name
 */
export function getBucketName(): string {
  return S3_BUCKET;
}
