import { readdirSync } from "fs";
import { join, parse } from "path";
import * as mime from "mime";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { Route } from "@pulumi/awsx/classic/apigateway";

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
    indexDocument: "index.html",
  },
});
const siteDir = "../www";

for (const item of readdirSync(siteDir)) {
  const filePath = join(siteDir, item);
  const object = new aws.s3.BucketObject(item, {
    bucket: siteBucket,
    source: new pulumi.asset.FileAsset(filePath),
    contentType: mime.getType(filePath) || undefined,
  });
}

exports.bucketName = siteBucket.bucket; // create a stack export for bucket name

function publicReadPolicyForBucket(bucketName: string) {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  });
}

const bucketPolicy = new aws.s3.BucketPolicy("fe-bucket-policy", {
  bucket: siteBucket.bucket,
  policy: siteBucket.bucket.apply(publicReadPolicyForBucket),
});

exports.websiteUrl = siteBucket.websiteEndpoint;

const lambdaDir = "../bin";

const lambdaRole = new aws.iam.Role("lambdaRole", {
  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
        Effect: "Allow",
        Sid: "",
      },
    ],
  },
  inlinePolicies: [
    {
      name: "ReadWriteTable",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "ReadWriteTableAndLogs",
            Effect: "Allow",
            Action: [
              "dynamodb:GetItem",
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:PutItem",
              "dynamodb:ListTables",
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            Resource: "*",
          },
        ],
      }),
    },
  ],
});

// const lambdaRoleAttachment = new aws.iam.RolePolicyAttachment(
//   "lambdaRoleAttachment",
//   {
//     role: pulumi.interpolate`${lambdaRole.name}`,
//     policyArn: aws.iam.ManagedPolicy.AWSLambdaDynamoDBExecutionRole,
//   }
// );

const lambdas = readdirSync(lambdaDir).reduce((lambdas, lambdaFile) => {
  const filename = join(lambdaDir, lambdaFile);
  const basename = parse(lambdaFile).name;

  const object = new aws.lambda.Function(`hello-world-aws-${basename}`, {
    role: lambdaRole.arn,
    runtime: "nodejs18.x",
    handler: `${basename}/${basename}.handler`,
    code: new pulumi.asset.AssetArchive({
      [basename]: new pulumi.asset.FileArchive(filename),
    }),
  });

  const lambdaUrl = new aws.lambda.FunctionUrl(
    `hello-world-aws-${basename}-url`,
    {
      functionName: object.name,
      authorizationType: "NONE",
    }
  );

  lambdas[basename] = object;
  return lambdas;
}, {} as Record<string, any>);

const Users = new aws.dynamodb.Table("hello-world-aws-users", {
  attributes: [
    {
      name: "email",
      type: "S",
    },
  ],
  hashKey: "email",
  readCapacity: 10,
  writeCapacity: 10,
});

const API_ROUTES: Route[] = [
  { path: "/login", method: "GET", eventHandler: lambdas.login },
  { path: "/register", method: "POST", eventHandler: lambdas.register },
];

const apiGateway = new awsx.classic.apigateway.API("rest-api", {
  routes: API_ROUTES,
  restApiArgs: {
    binaryMediaTypes: [],
  },
});

exports.apiGatewayUrl = apiGateway.url;
