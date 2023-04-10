import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import {
  AdminInitiateAuthCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

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

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
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
    const { email, password } = parsedBody;

    if (isEmpty(email) || isEmpty(password)) {
      return response(
        HttpStatusCode.BAD_REQUEST,
        "provided payload is not valid",
      );
    }

    const initiateAuthCommand = new AdminInitiateAuthCommand({
      ClientId: USER_POOL_CLIENT_ID,
      UserPoolId: USER_POOL_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
      AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
    });
    await identityProviderClient.send(initiateAuthCommand);
    console.log("Logged in successfully");

    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: {
        email: {
          S: email,
        },
      },
    });
    const { Item } = await documentClient.send(command);
    console.log("User Data retrieved successfully");

    return response(
      HttpStatusCode.OK,
      Item !== undefined ? unmarshall(Item) : undefined,
    );
    // rome-ignore lint/suspicious/noExplicitAny: Catch clause accepts only any or unknown
  } catch (e: any) {
    const statusCode =
      e?.$metadata?.httpStatusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;

    console.error("Lambda Function failed with ", e);
    return response(statusCode, e);
  }
};
