import { APIGatewayEvent } from "aws-lambda";

export const handler = async (event: APIGatewayEvent) => {
  try {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      isBase64Encoded: false,
      body: JSON.stringify({ hello: "world" }),
    };
  } catch (e) {
    console.error(e);
    return 500;
  }
};
