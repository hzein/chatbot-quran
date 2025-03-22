import { SignedIn, SignedOut } from "@clerk/tanstack-start";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/multi-select";

// Define a type for the model data structure
interface Model {
  value: string;
  label: string;
}

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const [models, setModels] = useState<string[]>([]);
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
            let modelName = model.id.split("/")[1];
            modelName = modelName.slice(0, -5);
            modelName = `openrouter:${modelName}`;
            return {
              value: modelName,
              label: modelName,
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
                <Input
                  id="query"
                  type="text"
                  placeholder="Enter your query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm p-5 w-full md:w-[400px] lg:w-[500px] focus:outline-none focus:ring-0 focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  variant="ghost"
                  className="rounded-lg border bg-card text-card-foreground shadow-sm p-5 outline-none focus:outline-none focus:ring-0 focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                >
                  Submit
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
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
                      maxCount={3}
                      className="outline-none focus:outline-none focus:ring-0 focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                    />
                  )}
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
