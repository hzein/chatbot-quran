import { createServerFn } from "@tanstack/react-start";
import { getHeaders, getWebRequest } from "@tanstack/react-start/server";


interface GenerateResponse {
  response: string;
  status: string;
}

type dataType = {
  model: string
  query: string
}

// Create a server function to handle the Quran API requests
export const generateQuranResponse = createServerFn({ method: "GET", response: "raw" }).validator((data: dataType) => data).handler(async ({data}) => {

  try {
    const model = data.model;
    const query = data.query;

    if (!model || !query) {
      throw new Error("Missing required fields: model and query");
    }

    // Access API key from environment variables
    const apiKey = process.env.USER_API_KEY;
    const apiUrl = process.env.FASTAPI_URL;

    if (!apiKey) {
      throw new Error("API key not found in environment variables");
    }

    // Make the API request
    const response = await fetch(`${apiUrl}?model=${model}&query=${query}`, {
      method: "GET",
      headers: {
        "X-API-Key": `${apiKey}`
      },
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error details available");
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Since you mentioned the response is text/plain, we'll use .text() instead of .json()
    // const responseText = await response.text();
    const responseText = await response.json()
    
    // Return a proper Response object as required by the 'raw' response type
    const responseData = {
      response: responseText.content,
      source: responseText.response_source,
      status: "success"
    };
    
    console.log(responseData)
    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error calling Quran API:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage, status: "error" }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}); 