import { APIGatewayEvent } from "aws-lambda";
import {
  DynamoDBClient,
  ListTablesCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";

const documentClient = new DynamoDBClient({});
const listTablesCommand = new ListTablesCommand({
  ExclusiveStartTableName: "hello-world-aws-users",
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

    const command = new ScanCommand({ TableName: tableName });
    const results = await documentClient.send(command);

    console.log(results);

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
