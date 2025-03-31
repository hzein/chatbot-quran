import { SignedIn, SignedOut } from "@clerk/tanstack-start";
import { createFileRoute } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { useState, useEffect } from "react";
import {
  generateQuranResponse,
  addToCache,
  updateCache,
} from "@/api/quran-api";
import { Sidebar } from "@/components/Sidebar";
import { ModelResponseCard } from "@/components/ModelResponseCard";
import { ReferencesPanel } from "@/components/ReferencesPanel";

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

// Define an interface for the expected cache response data
interface CacheResponseData {
  status: "success" | "error"; // Expecting a string status
  doc_id?: string;
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
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
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
        setIsLoadingModels(false);
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
    setContext([]);
    setSource("");
    setCacheDoc("");

    const initialResponses = models.map((model) => ({
      model,
      result: "",
      context: [],
      status: "pending",
      loading: true,
    }));
    setModelResponses(initialResponses);

    let firstSuccessfulResponseProcessed = false;

    models.forEach(async (model, index) => {
      try {
        const responseData = await generateQuranResponse({
          data: {
            model: model,
            query: query,
          },
        });

        setModelResponses((prevResponses) => {
          const newResponses = [...prevResponses];
          const response = responseData as any;
          const currentSource = response?.source || "";
          const currentContext = response?.context || [];

          newResponses[index] = {
            model,
            result: response?.response || "",
            source: currentSource,
            context: currentContext,
            status: "completed",
            loading: false,
          };

          if (
            !firstSuccessfulResponseProcessed &&
            (currentContext.length > 0 || currentSource)
          ) {
            setContext(currentContext);
            setSource(currentSource);
            const cacheDocValue = currentSource.startsWith("cache-")
              ? currentSource.substring("cache-".length)
              : "";
            setCacheDoc(cacheDocValue);
            firstSuccessfulResponseProcessed = true;
          }

          return newResponses;
        });
      } catch (error) {
        console.error(`Error with model ${model}:`, error);
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
      } finally {
        setModelResponses((currentResponses) => {
          const allDone = currentResponses.every((resp) => !resp.loading);
          if (allDone) {
            setIsSubmitting(false);
            setCache("");
          }
          return currentResponses;
        });
      }
    });
  };

  const handleSetCache = async () => {
    if (!query || !cache) {
      alert("Please provide both a query and content to cache");
      return;
    }

    if (!source) {
      alert(
        "Cannot set/update cache. Please run a query first to associate it with context or generate a cache ID."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (source && source.toLowerCase().includes("cache") && cacheDoc) {
        const response = await updateCache({
          data: { query: query, content: cache, doc_id: cacheDoc },
        });
        if (response.status === "success") {
          alert("Cache updated successfully");
        } else {
          alert(`Failed to update cache: ${response.error || "Unknown error"}`);
        }
      } else {
        const response = await addToCache({
          data: { query: query, content: cache },
        });
        console.log(response);
        if (response.status === "success") {
          alert("Added to cache successfully");
        } else {
          alert(`Failed to add to cache: ${response.error || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Error handling cache:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
      setCache("");
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
    <div className="w-full">
      <SignedIn>
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr,300px]">
            <Sidebar
              query={query}
              setQuery={setQuery}
              cache={cache}
              setCache={setCache}
              models={models}
              setModels={setModels}
              availableModels={availableModels}
              isLoadingModels={isLoadingModels}
              isSubmitting={isSubmitting}
              handleSubmit={handleSubmit}
              handleSetCache={handleSetCache}
              source={source}
            />

            <div className="flex flex-col space-y-4">
              {hasSubmitted && modelResponses.length > 0 && (
                <div className="rounded-3xl p-4 shadow-sm w-full">
                  <div className="flex flex-col space-y-4">
                    {modelResponses.map((response) => (
                      <ModelResponseCard
                        key={response.model}
                        response={response}
                        copyToClipboard={copyToClipboard}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <ReferencesPanel
              context={context}
              copyToClipboard={copyToClipboard}
              hasSubmitted={hasSubmitted}
            />
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
