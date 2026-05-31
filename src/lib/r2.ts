import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
  region: "auto",
});

export const uploadToR2 = async (fileBuffer: Buffer, fileName: string, contentType: string) => {
  const bucketName = process.env.R2_BUCKET_NAME || "kindred";
  
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || `https://pub-d33c13728d81440088421e0298b11617.r2.dev`;
  return `${publicUrl}/${fileName}`;
};
