import React from "react";
import { Copy } from "lucide-react";

interface ReferencesPanelProps {
  context: string[];
  copyToClipboard: (text: string) => void;
  hasSubmitted: boolean;
}

export const ReferencesPanel: React.FC<ReferencesPanelProps> = ({
  context,
  copyToClipboard,
  hasSubmitted,
}) => {
  if (!hasSubmitted || context.length === 0) {
    return null; // Don't render if no context or not submitted yet
  }

  return (
    <div className="shadow-sm h-96">
      <div className="h-full bg-card text-card-foreground shadow-sm outline-none">
        <h4 className=" text-yellow-500 border-l text-lg font-semibold p-4 border-b">
          References:
        </h4>
        {context.map((response, index) => (
          <div
            key={index}
            className="text-sm whitespace-pre-wrap border-l pl-4 border-b pb-4 pt-4 flex justify-between items-start"
          >
            <p>{`${index + 1} - ${response}`}</p>
            <button
              onClick={() => copyToClipboard(response)}
              className="ml-2 p-1 hover:bg-gray-700 rounded-md" // Adjusted hover color for better visibility on dark bg
              title="Copy to clipboard"
            >
              <Copy size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
