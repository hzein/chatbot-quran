import { createServerFn } from "@tanstack/react-start";
import { getHeaders, getWebRequest } from "@tanstack/react-start/server";


interface GenerateResponse {
  response: string;
  status: string;
  source?: string;
  context?: string[];
  error?: string;
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
    const response = await fetch(`${apiUrl}/generate?model=${model}&query=${query}`, {
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
      context: responseText.context,
      status: "success"
    };
    
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

// Type for addToCache data
type AddToCacheData = {
  query: string
  content: string
}

// Create a server function to add content to cache
export const addToCache = createServerFn({ method: "POST", response: "raw" }).validator((data: AddToCacheData) => data).handler(async ({data}) => {
  try {
    const { query, content } = data;

    if (!query || !content) {
      throw new Error("Missing required fields: query and content");
    }

    // Access API key from environment variables
    const apiKey = process.env.USER_API_KEY;
    const apiUrl = process.env.FASTAPI_URL;

    if (!apiKey) {
      throw new Error("API key not found in environment variables");
    }

    // Make the API request
    const response = await fetch(`${apiUrl}/addtocache?query=${encodeURIComponent(query)}&content=${encodeURIComponent(content)}`, {
      method: "POST",
      headers: {
        "X-API-Key": `${apiKey}`,
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error details available");
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    
    return new Response(JSON.stringify({
      doc_id: responseData.doc_id,
      status: "success",
      message: "Added to cache successfully"
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error adding to cache:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage, status: "error" }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});

// Type for updateCache data
type UpdateCacheData = {
  query: string
  content: string
  doc_id: string
}

// Create a server function to update content in cache
export const updateCache = createServerFn({ method: "POST", response: "raw" }).validator((data: UpdateCacheData) => data).handler(async ({data}) => {
  try {
    const { query, content, doc_id } = data;

    if (!query || !content || !doc_id) {
      throw new Error("Missing required fields: query, content, and doc_id");
    }

    // Access API key from environment variables
    const apiKey = process.env.USER_API_KEY;
    const apiUrl = process.env.FASTAPI_URL;

    if (!apiKey) {
      throw new Error("API key not found in environment variables");
    }

    // Make the API request
    const response = await fetch(`${apiUrl}/updatecache?query=${encodeURIComponent(query)}&content=${encodeURIComponent(content)}&doc_id=${encodeURIComponent(doc_id)}`, {
      method: "POST",
      headers: {
        "X-API-Key": `${apiKey}`,
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error details available");
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    
    return new Response(JSON.stringify({
      status: "success",
      message: "Cache updated successfully"
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error updating cache:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage, status: "error" }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});

// Type for deleteCache data
type DeleteCacheData = {
  doc_id: string
}

// Create a server function to delete content from cache
export const deleteCache = createServerFn({ method: "POST", response: "raw" }).validator((data: DeleteCacheData) => data).handler(async ({data}) => {
  try {
    const { doc_id } = data;

    if (!doc_id) {
      throw new Error("Missing required field: doc_id");
    }

    // Access API key from environment variables
    const apiKey = process.env.USER_API_KEY;
    const apiUrl = process.env.FASTAPI_URL;

    if (!apiKey) {
      throw new Error("API key not found in environment variables");
    }

    // Make the API request
    const response = await fetch(`${apiUrl}/deletecache?doc_id=${encodeURIComponent(doc_id)}`, {
      method: "DELETE",
      headers: {
        "X-API-Key": `${apiKey}`,
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error details available");
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Assuming the backend returns a success message upon successful deletion
    await response.json(); 
    
    return new Response(JSON.stringify({
      status: "success",
      message: "Cache item deleted successfully"
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error deleting cache item:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage, status: "error" }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});

