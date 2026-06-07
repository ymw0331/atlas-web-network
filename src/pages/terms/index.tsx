import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Button, Card, CardBody, Checkbox } from "@heroui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { getWithAuth } from "atlas-shared-web";

export default function Terms() {
    const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchTermsContent();
  }, []);

  const fetchTermsContent = async () => {
    try {
      const response = await getWithAuth("/network/files/colo-terms.md");
      if (response.ok) {
        const text = await response.text();
        setContent(text);
      }
    } catch (error) {
      console.error("Failed to fetch terms content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    // Handle acceptance logic
    console.log("Terms accepted");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="container mx-auto px-4 py-6 max-w-6xl flex-1 flex flex-col">
        {/* Content */}
        <Card className="shadow-md">
          {/* Header */}
          <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 rounded-t-lg">
            <h1 className="text-lg font-semibold">Co-Location Terms and Conditions</h1>
          </div>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <div
                    className={`px-6 py-6 ${expanded ? "" : "h-[calc(100vh-480px)] overflow-y-auto"}`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h2 className="text-base font-bold mt-6 mb-3 first:mt-0">{children}</h2>
                        ),
                        h2: ({ children }) => (
                          <h3 className="text-sm font-semibold mt-4 mb-2">{children}</h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="text-sm text-gray-700 dark:text-gray-300 mb-4 ml-4 space-y-1">{children}</ul>
                        ),
                        li: ({ children }) => (
                          <li className="leading-relaxed">{children}</li>
                        ),
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                    </div>
                  </div>
                  {!expanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
                  )}
                </div>

                {/* Expand/Collapse Button */}
                <div className="flex justify-center py-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="light"
                    size="sm"
                    startContent={expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                    onPress={() => setExpanded(!expanded)}
                  >
                    {expanded ? "Collapse" : "Expand"}
                  </Button>
                </div>

                {/* Acceptance Section */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-base font-semibold mb-3">Acceptance of Terms and Conditions</h3>
                  <Checkbox
                    isSelected={accepted}
                    onValueChange={setAccepted}
                    classNames={{
                      base: "items-start",
                      label: "text-sm",
                    }}
                  >
                    <div>
                      <p className="font-medium mb-2">I hereby declare and confirm that:</p>
                      <ul className="space-y-1 text-gray-600 dark:text-gray-400 list-none">
                        <li>(i) I have read and understood these Terms and Conditions; and</li>
                        <li>(ii) upon acceptance of the Application Form by ATLAS, I agree to be bound by these Terms and Conditions.</li>
                      </ul>
                    </div>
                  </Checkbox>
                </div>

                {/* Accept Button */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                  <Button
                    color="primary"
                    isDisabled={!accepted}
                    onPress={handleAccept}
                  >
                    Accept
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
