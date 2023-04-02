import { readdirSync } from "fs";
import { join } from "path";
import * as mime from "mime";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Create User Pool and Client
// const cognitoUserPool = new aws.cognito.UserPool("userPool", {});
// const cognitoUserPoolClient = new aws.cognito.UserPoolClient(
//     "userPoolClient", 
//     { 
//         userPoolId: cognitoUserPool.id,
//         generateSecret: true,
//         name: "hello-world-aws-app"
//     }
// );

// S3 Bucket
const siteBucket = new aws.s3.Bucket("fe-bucket", {
    website: {
        indexDocument: "index.html"
    }
} );
const siteDir = "../www";

for (const item of readdirSync(siteDir)) {
    const filePath = join(siteDir, item);
    const object = new aws.s3.BucketObject(item, {
        bucket: siteBucket,
        source: new pulumi.asset.FileAsset(filePath),
        contentType: mime.getType(filePath) || undefined,

    })
}

exports.bucketName = siteBucket.bucket; // create a stack export for bucket name

function publicReadPolicyForBucket(bucketName: string) {
    return JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: "*",
            Action: [
                "s3:GetObject"
            ],
            Resource: [
                `arn:aws:s3:::${bucketName}/*`
            ]
        }]
    });
} 


const bucketPolicy = new aws.s3.BucketPolicy("fe-bucket-policy", {
    bucket: siteBucket.bucket,
    policy: siteBucket.bucket.apply(publicReadPolicyForBucket)
});

exports.websiteUrl = siteBucket.websiteEndpoint;