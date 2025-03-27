import { SignedIn, SignedOut } from "@clerk/tanstack-start";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/multi-select";
import { generateQuranResponse } from "@/api/quran-api";

// Define a type for the model data structure
interface Model {
  value: string;
  label: string;
}

interface ModelResponse {
  model: string;
  result: string;
  status: string;
  loading: boolean;
  error?: string;
}

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const [models, setModels] = useState<string[]>([]);
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
      status: "pending",
      loading: true,
    }));

    setModelResponses(initialResponses);

    // Process each model individually
    models.forEach(async (model, index) => {
      try {
        // // Call our server function with FormData
        // const endpoint = "/__server_fn/quran-api/generateQuranResponse";
        // const formData = new FormData();
        // formData.append("model", model);
        // formData.append("query", query);

        // const response = await fetch(endpoint, {
        //   method: "POST",
        //   body: formData,
        // });
        const result = await generateQuranResponse({
          data: {
            model: model,
            query: query,
          },
        });
        // if (!response.ok) {
        //   throw new Error(`Server function failed: ${response.status}`);
        // }
        // console.log(`REPONSEEEE: ${response}`);
        // const result = await response.json();

        // Update just this model's response in the state
        setModelResponses((prevResponses) => {
          const newResponses = [...prevResponses];
          newResponses[index] = {
            model,
            result: result.response,
            source: result.source,
            status: result.status,
            loading: false,
          };
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
                      className="rounded-lg border bg-white text-black disabled:opacity-100 shadow-sm px-4 py-2 outline-none focus:outline-none focus:ring-0 focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
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
                  </div>
                </div>
              </div>

              {/* Model responses appear directly below the inputs */}
              <div className="rounded-3xl p-4 shadow-sm w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {hasSubmitted &&
                    modelResponses.map((response, index) => (
                      <div
                        key={response.model}
                        className="rounded-3xl h-auto min-h-48 border bg-card text-card-foreground shadow-sm p-5 outline-none overflow-auto"
                      >
                        <div className="flex flex-row">
                          <h3 className="font-bold text-lg mb-2 border-b pb-2">
                            {response.model}
                          </h3>
                          <p className="text-xs whitespace-pre-wrap">
                            {response.source}
                          </p>
                        </div>
                        {response.loading ? (
                          <div className="animate-pulse h-32 bg-zinc-800/20 rounded"></div>
                        ) : response.error ? (
                          <div className="text-red-500 text-sm">
                            {response.error}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {response.result}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right panel as a separate column */}
            <div className="rounded-3xl p-4 shadow-sm h-96">
              <div className="h-full bg-card text-card-foreground shadow-sm p-5 outline-none border-l">
                {"Test"}
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col items-center justify-center py-52 h-full">
          <h1>Please sign in</h1>
        </div>
      </SignedOut>
    </div>
  );
}
