import { Hono } from "hono";
import { z } from "zod";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, IMAGES_BUCKET } from "../../shared/storage/client";
import { requireAuth } from "../../shared/middleware";

const images = new Hono();

const uploadUrlSchema = z.object({
  folder: z.enum(["movies", "reviews", "rooms"]),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
});

const batchSchema = z.object({
  keys: z.array(z.string()),
});

// POST /images/upload-url - Get a pre-signed URL for uploading
images.post("/upload-url", requireAuth(), async (c) => {
  try {
    const body = await c.req.json();
    const result = uploadUrlSchema.safeParse(body);

    if (!result.success) {
      return c.json({ success: false, error: result.error.errors }, 400);
    }

    const { folder, contentType } = result.data;
    const extension = contentType.split("/")[1];
    const key = `${folder}/${crypto.randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: IMAGES_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes

    return c.json({
      success: true,
      data: {
        uploadUrl,
        key,
      },
    });
  } catch (error) {
    console.error("[images]", "Error generating upload URL:", error);
    return c.json({ success: false, error: "Failed to generate upload URL" }, 500);
  }
});

// POST /images/batch - Get pre-signed URLs for a list of keys
images.post("/batch", async (c) => {
  try {
    const body = await c.req.json();
    const result = batchSchema.safeParse(body);

    if (!result.success) {
      return c.json({ success: false, error: result.error.errors }, 400);
    }

    const { keys } = result.data;
    const urls: Record<string, string> = {};

    await Promise.all(
      keys.map(async (key) => {
        try {
          const command = new GetObjectCommand({
            Bucket: IMAGES_BUCKET,
            Key: key,
          });
          urls[key] = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        } catch (err) {
            console.error(`Failed to sign url for key ${key}`, err);
        }
      })
    );

    return c.json({
      success: true,
      data: urls,
    });
  } catch (error) {
     console.error("[images]", "Error processing batch:", error);
     return c.json({ success: false, error: "Failed to process batch" }, 500);
  }
});

// GET /images/:key - Redirect to a pre-signed URL for viewing
// :key+ captures the full path (e.g., "movies/abc.jpg")
images.get("/:key+", async (c) => {
  const key = c.req.param("key");

  try {
    const command = new GetObjectCommand({
      Bucket: IMAGES_BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    // Redirect to the signed URL
    return c.redirect(url);
  } catch (error) {
    console.error("[images]", "Error generating view URL:", error);
    return c.json({ success: false, error: "Failed to generate view URL" }, 500);
  }
});

export default images;
