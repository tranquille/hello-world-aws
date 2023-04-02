import { APIGatewayEvent } from 'aws-lambda';

export const handler = async(event: APIGatewayEvent) => {
    try {
        return {
          status: 200,
          body: JSON.stringify({"hello": "world"}),
          headers: {
            "content-type": "application/json"
          }
        };
    }
    catch (e) {
        console.error(e);
        return 500;
    }
};