import { SignedIn, SignedOut } from "@clerk/tanstack-start";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/multi-select";
import {
  generateQuranResponse,
  addToCache,
  updateCache,
} from "@/api/quran-api";
import { Spinner } from "@heroui/spinner";
import { Textarea } from "@/components/ui/textarea";

// Define a type for the model data structure
interface Model {
  value: string;
  label: string;
}

interface ModelResponse {
  model: string;
  result: string;
  status: string;
  context: string[];
  loading: boolean;
  source?: string;
  error?: string;
}

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const [cache, setCache] = useState("");
  const [cacheDoc, setCacheDoc] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [context, setContext] = useState<string[]>([]);
  const [source, setSource] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [modelResponses, setModelResponses] = useState<ModelResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableModels, setAvailableModels] = useState<Model[]>([
    {
      value: "google:gemini-2.0-pro-exp-02-05",
      label: "google:gemini-2.0-pro-exp-02-05",
    },
    {
      value: "google:gemini-2.0-flash-thinking-exp-01-21",
      label: "google:gemini-2.0-flash-thinking-exp-01-21",
    },
    {
      value: "groq:deepseek-r1-distill-llama-70b",
      label: "groq:deepseek-r1-distill-llama-70b",
    },
    {
      value: "groq:deepseek-r1-distill-qwen-32b",
      label: "groq:deepseek-r1-distill-qwen-32b",
    },
    {
      value: "groq:llama-3.3-70b-versatile",
      label: "groq:llama-3.3-70b-versatile",
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("https://openrouter.ai/api/v1/models");
        const data = await response.json();

        // Filter models that end with ":free"
        const freeModels = data.data
          .filter((model: any) => model.id.endsWith(":free"))
          .map((model: any) => {
            let modelName = `openrouter:${model.id}`;
            return {
              value: modelName,
              label: modelName,
            };
          });

        // Only add models that don't already exist in availableModels
        setAvailableModels((prevModels) => {
          const existingValues = new Set(
            prevModels.map((model) => model.value)
          );
          const uniqueNewModels = freeModels.filter(
            (model: Model) => !existingValues.has(model.value)
          );
          return [...prevModels, ...uniqueNewModels];
        });
      } catch (error) {
        console.error("Error fetching models:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleSubmit = async () => {
    if (!query || models.length === 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setHasSubmitted(true);

    // Initialize responses for all selected models
    const initialResponses = models.map((model) => ({
      model,
      result: "",
      context: [],
      status: "pending",
      loading: true,
    }));

    setModelResponses(initialResponses);

    // Process each model individually
    models.forEach(async (model, index) => {
      try {
        const responseData = await generateQuranResponse({
          data: {
            model: model,
            query: query,
          },
        });

        // Update just this model's response in the state
        setModelResponses((prevResponses) => {
          const newResponses = [...prevResponses];
          newResponses[index] = {
            model,
            // Use 'as any' to bypass incorrect type inference for responseData
            // Assume responseData holds the parsed data despite the type error
            result: (responseData as any)?.response || "",
            source: (responseData as any)?.source || "",
            context: (responseData as any)?.context || [],
            // Set status to 'completed' as this block handles successful responses
            status: "completed",
            loading: false,
          };
          setContext((responseData as any)?.context || []);
          setSource((responseData as any)?.source || "");
          const sourceValue = (responseData as any)?.source || "";
          const cacheDocValue = sourceValue.startsWith("cache-")
            ? sourceValue.substring("cache-".length)
            : sourceValue;
          setCacheDoc(cacheDocValue);
          return newResponses;
        });
      } catch (error) {
        console.error(`Error with model ${model}:`, error);

        // Update just this model's error in the state
        setModelResponses((prevResponses) => {
          const newResponses = [...prevResponses];
          newResponses[index] = {
            model,
            result: "",
            context: [],
            status: "error",
            loading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
          return newResponses;
        });
      }
    });

    // Set isSubmitting to false immediately after launching all requests
    setIsSubmitting(false);
  };

  const handleSetCache = async () => {
    if (!query || !cache) {
      alert("Please provide both a query and content to cache");
      return;
    }

    setIsSubmitting(true);
    try {
      if (source && source.toLowerCase().includes("cache")) {
        // Update the existing cache entry
        const responseData = await updateCache({
          data: {
            query: query,
            content: cache,
            doc_id: cacheDoc,
          },
        });

        if (responseData.status === "success") {
          alert("Cache updated successfully");
        } else {
          alert(
            `Failed to update cache: ${
              responseData.error ||
              JSON.stringify(responseData) ||
              "Unknown error"
            }`
          );
        }
      } else {
        // Add a new cache entry
        const response = await addToCache({
          data: {
            query: query,
            content: cache,
          },
        });

        const responseData = await (response as Response).json();

        if (responseData.status === "success") {
          setCacheDoc(responseData.doc_id);
          setSource(`cache-${responseData.doc_id}`);
          alert("Added to cache successfully");
        } else {
          alert(
            `Failed to add to cache: ${
              responseData.error ||
              JSON.stringify(responseData) ||
              "Unknown error"
            }`
          );
        }
      }
    } catch (error) {
      console.error("Error handling cache:", error);
      const errorMessage =
        error instanceof Error
          ? `${error.message}${error.stack ? `\n${error.stack}` : ""}`
          : "Unknown error";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Text copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <div className="p-2 w-full">
      <SignedIn>
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-4">
            <div className="flex flex-col space-y-4">
              <div className="rounded-3xl p-4 shadow-sm">
                <div className="flex flex-col space-y-4">
                  <div className="flex gap-2 w-full">
                    <Input
                      id="query"
                      type="text"
                      placeholder="Enter your query"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 w-full focus:outline-none focus:ring-0 focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button
                      variant="secondary"
                      className="rounded-lg border bg-yellow-500 text-black disabled:opacity-100 shadow-sm px-4 py-2 outline-none focus:outline-none focus:ring-0 focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !query || models.length === 0}
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                    <div className="w-full max-w-md">
                      {isLoading ? (
                        <div className="bg-zinc-800 border border-gray-300 rounded-md px-3 py-1 w-full min-h-[80px] flex items-center justify-center">
                          Loading models...
                        </div>
                      ) : (
                        <MultiSelect
                          options={availableModels}
                          onValueChange={setModels}
                          placeholder="Select models"
                          variant="default"
                          animation={2}
                          maxCount={2}
                          maxSelections={6}
                          className="outline-none focus:outline-none focus:ring-0 focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                        />
                      )}
                    </div>
                    <Textarea
                      value={cache}
                      onChange={(e) => setCache(e.target.value)}
                      className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 w-full focus:outline-none focus:ring-0 focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                    />
                    <Button
                      variant="secondary"
                      className="rounded-lg border bg-yellow-500 text-black disabled:opacity-100 shadow-sm px-4 py-2 outline-none focus:outline-none focus:ring-0 focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                      onClick={handleSetCache}
                      disabled={!hasSubmitted || isSubmitting}
                    >
                      {source && source.toLowerCase().includes("cache")
                        ? "Update Cache"
                        : "Set Cache"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Model responses appear directly below the inputs */}
              <div className="rounded-3xl p-4 shadow-sm w-full">
                <div className="flex flex-col space-y-4">
                  {hasSubmitted &&
                    modelResponses.map((response, index) => (
                      <div
                        key={response.model}
                        className="rounded-3xl w-full border bg-card text-card-foreground shadow-sm p-5 outline-none overflow-auto"
                      >
                        <div className="flex flex-row justify-between mb-3 border-b pb-2 text-yellow-500">
                          <h3 className="font-bold text-lg">
                            {response.model}
                          </h3>
                          {response.source && (
                            <p className="text-xs whitespace-pre-wrap text-yellow-500">
                              {response.source}
                            </p>
                          )}
                        </div>
                        {response.loading ? (
                          <div
                            role="status"
                            className="flex items-center justify-center"
                          >
                            <svg
                              aria-hidden="true"
                              className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                              viewBox="0 0 100 101"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                fill="currentColor"
                              />
                              <path
                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                fill="currentFill"
                              />
                            </svg>
                            <span className="sr-only">Loading...</span>
                          </div>
                        ) : response.error ? (
                          <div className="text-red-500 text-sm">
                            {response.error}
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <p className="text-sm whitespace-pre-wrap flex-grow mr-2">
                              {response.result}
                            </p>
                            <button
                              onClick={() => copyToClipboard(response.result)}
                              className="p-1 hover:bg-gray-700 rounded-md flex-shrink-0"
                              title="Copy result to clipboard"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right panel as a separate column */}
            <div className="p-4 shadow-sm h-96">
              <div className="h-full bg-card text-card-foreground shadow-sm p-5 outline-none">
                {hasSubmitted &&
                  context.map((response, index) => (
                    <div
                      key={index}
                      className="text-sm whitespace-pre-wrap border-l pl-4 border-b pb-4 pt-4 text-yellow-500 flex justify-between items-start"
                    >
                      <p>{`${index + 1} - ${response}`}</p>
                      <button
                        onClick={() => copyToClipboard(response)}
                        className="ml-2 p-1 hover:bg-gray-200 rounded-md"
                        title="Copy to clipboard"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col items-center justify-center py-52 h-full text-yellow-500">
          <h1>Please sign in</h1>
        </div>
      </SignedOut>
    </div>
  );
}
