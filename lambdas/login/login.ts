import {
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";

import {
  AdminInitiateAuthCommand,
  AdminInitiateAuthCommandInput,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

const documentClient = new DynamoDBClient({});
const identityProviderClient = new CognitoIdentityProviderClient({});

const USER_POOL_ID = process.env.USER_POOL_ID;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID;
const TABLE_NAME = process.env.USER_DB_TABLE_NAME;

export const handler = async (event: any) => {
  try {
    const { username, password } = event;

    const authInput: AdminInitiateAuthCommandInput = {
      ClientId: USER_POOL_CLIENT_ID,
      UserPoolId: USER_POOL_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
      AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
    };
    const initiateAuthCommand = new AdminInitiateAuthCommand(authInput);

    const loginResult = await identityProviderClient.send(initiateAuthCommand);
    console.log(loginResult);

    if (loginResult.AuthenticationResult?.AccessToken) {
      const command = new QueryCommand({ TableName: tableName });
      const results = await documentClient.send(command);
      console.log(results);
    }

    return {
      status: 200,
      body: JSON.stringify(results.Items),
      headers: {
        "Content-Type": "application/json",
      },
      isBase64Encoded: false,
    };
  } catch (e) {
    console.error("Lambda Function failed with ", e);
    return 500;
  }
};
