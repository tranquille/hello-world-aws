vi.mock("@aws-sdk/util-dynamodb");

const identityProviderSend = vi.fn();
vi.mock("@aws-sdk/client-cognito-identity-provider", async () => {
  // rome-ignore lint/suspicious/noExplicitAny: <explanation>
  const actual: any = await vi.importActual(
    "@aws-sdk/client-cognito-identity-provider",
  );

  const CognitoIdentityProviderClient = vi.fn(() => ({
    send: identityProviderSend,
  }));

  return { ...actual, CognitoIdentityProviderClient };
});

const dynamoDbSend = vi.fn();
vi.mock("@aws-sdk/client-dynamodb", async () => {
  // rome-ignore lint/suspicious/noExplicitAny: <explanation>
  const actual: any = await vi.importActual("@aws-sdk/client-dynamodb");

  const DynamoDBClient = vi.fn(() => ({
    send: dynamoDbSend,
  }));

  return { ...actual, DynamoDBClient };
});

import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "./user";

const getTestEvent = (_payload: unknown, isBase64Encoded = false) => {
  let payload = JSON.stringify(_payload);
  if (isBase64Encoded) {
    payload = Buffer.from(JSON.stringify(_payload)).toString("base64");
  }

  return {
    body: payload,
    headers: {},
    multiValueHeaders: {},
    httpMethod: "POST",
    isBase64Encoded,
    path: "",
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    // rome-ignore lint/suspicious/noExplicitAny: It's a test
    requestContext: {} as any,
    resource: "",
  };
};

describe("Login Lambda", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("retrieves the user data if a AuthenticationToken is provided", async () => {
    identityProviderSend.mockReturnValue({
      UserAttributes: [
        {
          Name: "email",
          Value: "asdf@asdf.de",
        },
      ],
    });
    dynamoDbSend.mockReturnValue({
      Item: {
        SS: ["Volleyball", "Basketball"],
      },
    });
    const testEvent: APIGatewayProxyEvent = getTestEvent({
      token: "asdsadsadasdsadsad",
    });

    const result = await handler(testEvent);

    expect(identityProviderSend).toHaveBeenCalled();

    expect(dynamoDbSend).toHaveBeenCalled();

    expect(result).toMatchSnapshot();
  });
});
