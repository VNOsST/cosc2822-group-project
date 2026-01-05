import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION || "us-east-1";

export const s3Client = new S3Client({ region });

export const IMAGES_BUCKET = process.env.IMAGES_BUCKET || "";
