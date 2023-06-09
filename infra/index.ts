import { readdirSync } from "fs";
import { join, parse } from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { Route } from "@pulumi/awsx/classic/apigateway";

const namePrefix = "hello-world-aws";

const userPool = new aws.cognito.UserPool("userPool", {
  name: `${namePrefix}-user-pool`,
  schemas: [
    {
      name: "email",
      required: true,
      attributeDataType: "String",
      stringAttributeConstraints: {
        maxLength: "2048",
        minLength: "0",
      },
    },
  ],
  passwordPolicy: {
    minimumLength: 6,
    requireSymbols: false,
    requireNumbers: true,
    requireLowercase: true,
    requireUppercase: true,
    temporaryPasswordValidityDays: 7,
  },
  usernameConfiguration: {
    caseSensitive: false,
  },
  usernameAttributes: ["email"],
});

const userPoolClient = new aws.cognito.UserPoolClient("userPoolClient", {
  name: `${namePrefix}-user-pool-client`,
  userPoolId: userPool.id,
  generateSecret: false,
  explicitAuthFlows: [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
  ],
});

const usersTable = new aws.dynamodb.Table(`${namePrefix}-users`, {
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
      name: "AuthReadWriteTable",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AuthReadWriteTableAndLogs",
            Effect: "Allow",
            Action: [
              "cognito-idp:AdminInitiateAuth",
              "cognito-idp:AdminConfirmSignUp",
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

const lambdaDir = "../bin";

const lambdas = readdirSync(lambdaDir).reduce((lambdas, lambdaFile) => {
  if (lambdaFile === "node_modules") {
    return lambdas;
  }
  const filename = join(lambdaDir, lambdaFile);
  const basename = parse(lambdaFile).name;

  const object: aws.lambda.Function = new aws.lambda.Function(
    `${namePrefix}-${basename}`,
    {
      role: lambdaRole.arn,
      runtime: "nodejs18.x",
      handler: `${basename}/${basename}.handler`,
      code: new pulumi.asset.AssetArchive({
        [basename]: new pulumi.asset.FileArchive(filename),
      }),
      environment: {
        variables: {
          USER_POOL_ID: userPool.id,
          USER_POOL_CLIENT_ID: userPoolClient.id,
          USER_DB_TABLE_NAME: usersTable.name,
        },
      },
      memorySize: 192,
    }
  );

  lambdas[basename] = object;
  return lambdas;
}, {} as Record<string, aws.lambda.Function>);

const paths = ["login", "register", "user"];

const routes: Route[] = paths.map((path) => ({
  path,
  method: "POST",
  eventHandler: aws.lambda.Function.get(
    `${namePrefix}-${path}-attach`,
    lambdas[path].id
  ),
}));

routes.push({
  path: "/",
  localPath: "../dist",
  index: true,
});

const apiGateway = new awsx.classic.apigateway.API(
  `${namePrefix}-api-gateway`,
  {
    routes,
  }
);

exports.apiGatewayUrl = apiGateway.url;
