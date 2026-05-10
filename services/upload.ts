import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Config } from "@/lib/env";

const config = getS3Config();

const s3 = new S3Client({
  region: config.region,
  ...(config.accessKeyId && config.secretAccessKey
    ? {
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey
        }
      }
    : {})
});

export async function getPresignedUploadUrl(key: string, contentType: string) {
  if (!config.bucket) {
    throw new Error("Missing S3_BUCKET_NAME");
  }
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType
  });

  return getSignedUrl(s3, command, { expiresIn: 60 * 5 });
}
