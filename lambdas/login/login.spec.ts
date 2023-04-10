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
import { handler } from "./login";

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

  it("handles a login request with username and password", async () => {
    dynamoDbSend.mockReturnValue({ Item: [] });
    const testEvent: APIGatewayProxyEvent = getTestEvent({
      email: "my@test.com",
      password: "asdf",
    });

    const result = await handler(testEvent);

    expect(identityProviderSend).toHaveBeenCalled();

    expect(dynamoDbSend).toHaveBeenCalled();

    expect(result).toMatchSnapshot();
  });

  it("handles a login request with username and password as base64", async () => {
    dynamoDbSend.mockReturnValue({ Item: [] });
    const testEvent: APIGatewayProxyEvent = getTestEvent(
      {
        email: "my@test.com",
        password: "asdf",
      },
      true,
    );

    const result = await handler(testEvent);

    expect(identityProviderSend).toHaveBeenCalled();

    expect(dynamoDbSend).toHaveBeenCalled();

    expect(result).toMatchSnapshot();
  });

  it.each`
    email            | password     | expected
    ${undefined}     | ${"qwert1T"} | ${400}
    ${"my@test.com"} | ${undefined} | ${400}
    ${""}            | ${"qwert1T"} | ${400}
    ${"my@test.com"} | ${""}        | ${400}
    ${""}            | ${""}        | ${400}
    ${undefined}     | ${undefined} | ${400}
  `(
    "handles a login request with incomplete payload",
    async ({ email, password, expected }) => {
      dynamoDbSend.mockReturnValue({ Item: [] });
      const testEvent: APIGatewayProxyEvent = getTestEvent({
        email,
        password,
      });

      const result = await handler(testEvent);

      expect(identityProviderSend).not.toHaveBeenCalled();

      expect(dynamoDbSend).not.toHaveBeenCalled();

      expect(result).toMatchSnapshot();
    },
  );

  it("rejects an unknown user", async () => {
    const testEvent: APIGatewayProxyEvent = getTestEvent({
      email: "unknown@unknown.de",
      password: "unkndown",
    });

    const error = {
      name: "UserNotFoundException",
      $fault: "client",
      $metadata: {
        httpStatusCode: 400,
        requestId: "3fccc512-2371-4782-95e5-94b01d2b29ae",
        attempts: 1,
        totalRetryDelay: 0,
      },
      __type: "UserNotFoundException",
    };

    identityProviderSend.mockImplementationOnce(() => {
      throw error;
    });

    const result = await handler(testEvent);

    expect(identityProviderSend).toHaveBeenCalled();

    expect(dynamoDbSend).not.toHaveBeenCalled();

    expect(result).toMatchSnapshot();
  });
});
