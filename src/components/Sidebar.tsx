import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/multi-select";

// Define a type for the model data structure
interface Model {
  value: string;
  label: string;
}

interface SidebarProps {
  query: string;
  setQuery: (query: string) => void;
  cache: string;
  setCache: (cache: string) => void;
  models: string[];
  setModels: (models: string[]) => void;
  availableModels: Model[];
  isLoadingModels: boolean;
  isSubmitting: boolean;
  handleSubmit: () => void;
  handleSetCache: () => void;
  handleDeleteCache: () => void;
  source?: string;
  cacheDoc?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  query,
  setQuery,
  cache,
  setCache,
  models,
  setModels,
  availableModels,
  isLoadingModels,
  isSubmitting,
  handleSubmit,
  handleSetCache,
  handleDeleteCache,
  source,
  cacheDoc,
}) => {
  const showDeleteButton = source && source.toLowerCase().includes("cache");

  return (
    <div className="flex flex-col space-y-4 w-80">
      <div className="rounded-3xl pt-4 pl-4 pb-4 shadow-sm">
        <div className="flex flex-col space-y-4">
          {/* Query Input and Submit Button */}
          <div className="flex flex-col gap-2 w-full">
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
              className="rounded-lg border bg-yellow-500 text-black disabled:opacity-100 shadow-sm px-4 py-2 outline-none focus:outline-none focus:ring-0 focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0 w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !query || models.length === 0}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>

          {/* Model Selector */}
          <div className="w-full">
            {isLoadingModels ? (
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

          {/* Cache Input and Button */}
          <div className="flex flex-col gap-2 w-full">
            <Textarea
              value={cache}
              onChange={(e) => setCache(e.target.value)}
              placeholder="Enter content to cache"
              className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 w-full focus:outline-none focus:ring-0 focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
            />
            <Button
              variant="secondary"
              className="rounded-lg border bg-yellow-500 text-black disabled:opacity-100 shadow-sm px-4 py-2 outline-none focus:outline-none focus:ring-0 focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0 w-full"
              onClick={handleSetCache}
              disabled={!cache || isSubmitting}
            >
              {source && source.toLowerCase().includes("cache")
                ? "Update Cache"
                : "Set Cache"}
            </Button>
            {showDeleteButton && (
              <Button
                variant="destructive"
                className="rounded-lg border bg-red-600 text-white disabled:opacity-50 shadow-sm px-4 py-2 outline-none focus:outline-none focus:ring-0 focus:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0 w-full"
                onClick={handleDeleteCache}
                disabled={isSubmitting || !cacheDoc}
              >
                Delete Cache
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
