import { APIGatewayEvent } from "aws-lambda";
import {
  DynamoDBClient,
  ListTablesCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";

const documentClient = new DynamoDBClient({});
const listTablesCommand = new ListTablesCommand({
  ExclusiveStartTableName: "hello-world-aws-users",
  Limit: 1,
});

export const handler = async (event: APIGatewayEvent) => {
  try {
    let tableName;
    const tableNames = (await documentClient.send(listTablesCommand))
      ?.TableNames;
    if (tableNames && tableNames.length > 0) {
      tableName = tableNames[0];
    } else {
      return {
        status: 404,
      };
    }
    console.log("Tablename: ", tableName, tableNames);

    const { body = "{}" } = event;
    const parsedBody = JSON.parse(body || "{}");
    const { email, sports } = parsedBody; // obtain event body sent from client

    const user = {
      email,
      sports,
    };

    const command = new PutItemCommand({
      TableName: tableName,
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
