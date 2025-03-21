import { SignedIn, SignedOut } from "@clerk/tanstack-start";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

// Define a type for the model data structure
interface Model {
  id: string;
  name: string;
}

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const [model, setModel] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<Model[]>([
    {
      id: "google:gemini-2.0-pro-exp-02-05",
      name: "google:gemini-2.0-pro-exp-02-05",
    },
    {
      id: "google:gemini-2.0-flash-thinking-exp-01-21",
      name: "google:gemini-2.0-flash-thinking-exp-01-21",
    },
    {
      id: "groq:deepseek-r1-distill-llama-70b",
      name: "groq:deepseek-r1-distill-llama-70b",
    },
    {
      id: "groq:deepseek-r1-distill-qwen-32b",
      name: "groq:deepseek-r1-distill-qwen-32b",
    },
    {
      id: "groq:llama-3.3-70b-versatile",
      name: "groq:llama-3.3-70b-versatile",
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
            let modelName = model.id.split("/")[1];
            modelName = modelName.slice(0, -5);
            modelName = `openrouter:${modelName}`;
            return {
              id: modelName,
              name: modelName,
            };
          });

        setAvailableModels((prevModels) => [...prevModels, ...freeModels]);
      } catch (error) {
        console.error("Error fetching models:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  return (
    <div className="p-2">
      <SignedIn>
        <div className="w-full max-w-6xl mx-auto">
          <div className="rounded-3xl p-2 mb-4 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="query" className="text-lg font-medium">
                  Query
                </label>
                <input
                  id="query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-zinc-800 border border-gray-300 rounded-md py-1 w-full md:w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="models" className="text-lg font-medium">
                  Models
                </label>
                <div className="relative w-full md:w-64">
                  {isLoading ? (
                    <div className="bg-zinc-800 border border-gray-300 rounded-md px-3 py-1 w-full min-h-[80px] flex items-center justify-center">
                      Loading models...
                    </div>
                  ) : (
                    <select
                      id="models"
                      multiple
                      value={model}
                      onChange={(e) => {
                        const selectedOptions = Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        );
                        setModel(selectedOptions);
                      }}
                      className="appearance-none bg-zinc-800 border border-gray-300 rounded-md px-3 py-1 w-full pr-10 min-h-[80px]"
                    >
                      {availableModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="rounded-3xl p-6 flex-grow shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="bg-zinc-800 rounded-3xl p-4 h-48 shadow-sm"
                  >
                    {/* Card content goes here */}
                  </div>
                ))}
              </div>
              <div className="h-64 md:h-96">{/* Main content area */}</div>
            </div>

            <div className="rounded-3xl p-6 w-full md:w-72 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Context reference</h2>
              <div className="bg-zinc-800 rounded-3xl p-4 h-96 shadow-sm">
                {/* Context reference content goes here */}
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <h1>Please sign in</h1>
      </SignedOut>
    </div>
  );
}
