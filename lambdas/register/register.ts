import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import {
  AdminConfirmSignUpCommand,
  CognitoIdentityProviderClient,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { APIGatewayProxyEvent } from "aws-lambda";

const documentClient = new DynamoDBClient({});
const identityProviderClient = new CognitoIdentityProviderClient({});

const USER_POOL_ID = process.env.USER_POOL_ID;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID;
const TABLE_NAME = process.env.USER_DB_TABLE_NAME;

enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  NOT_FOUND = 404,
  BAD_REQUEST = 400,
  INTERNAL_SERVER_ERROR = 500,
}

const response = (statusCode: HttpStatusCode, body?: unknown) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    isBase64Encoded: false,
    body: JSON.stringify(body),
  };
};

const isNotEmpty = (s: string): boolean =>
  s !== undefined && s !== null && typeof s === "string" && s.length > 0;

const isEmpty = (s: string): boolean => !isNotEmpty(s);

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const { body, isBase64Encoded } = event;
    if (body === undefined || body === null) {
      return response(HttpStatusCode.BAD_REQUEST, "body is not defined");
    }

    let parsedBody;
    if (isBase64Encoded === true) {
      const buff = Buffer.from(body, "base64");
      const eventBodyStr = buff.toString("utf8");
      parsedBody = JSON.parse(eventBodyStr);
    } else {
      parsedBody = JSON.parse(body);
    }
    const { email, password, sports } = parsedBody;

    if (isEmpty(email) || isEmpty(password) || !Array.isArray(sports)) {
      return response(
        HttpStatusCode.BAD_REQUEST,
        "provided payload is not valid",
      );
    }

    const signUpCommand = new SignUpCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: email,
      Password: password,
    });
    await identityProviderClient.send(signUpCommand);
    console.log("Signup successful");

    const confirmCommand = new AdminConfirmSignUpCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });
    await identityProviderClient.send(confirmCommand);
    console.log("User confirmed successfully");

    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        email,
        sports,
      }),
    });
    await documentClient.send(command);
    console.log("Data stored successfully");

    return response(HttpStatusCode.CREATED);
    // rome-ignore lint/suspicious/noExplicitAny: <explanation>
  } catch (e: any) {
    const statusCode =
      e?.$metadata?.httpStatusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;

    console.error("Lambda Function failed with ", e);
    return response(statusCode, e);
  }
};
