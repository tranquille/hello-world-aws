import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  SignUpCommandInput,
} from "@aws-sdk/client-cognito-identity-provider";

const documentClient = new DynamoDBClient({});
const identityProviderClient = new CognitoIdentityProviderClient({});

const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID;

const TABLE_NAME = process.env.USER_DB_TABLE_NAME;

export const handler = async (event: any) => {
  try {
    const { email, password, sports } = event; // obtain event body sent from client

    console.log(email, password, sports);

    const singUpInput: SignUpCommandInput = {
      ClientId: USER_POOL_CLIENT_ID,
      Username: email,
      Password: password,
    };
    const signUpCommand = new SignUpCommand(singUpInput);

    const signUpResult = await identityProviderClient.send(signUpCommand);

    console.log(signUpResult);

    const user = {
      email,
      sports,
    };

    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: user,
    });

    const result = await documentClient.send(command);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      isBase64Encoded: false,
      body: JSON.stringify(result),
    };
  } catch (e) {
    console.error("Lambda Function failed with ", e);
    return 500;
  }
};
