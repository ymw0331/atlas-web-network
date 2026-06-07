import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Button, Spinner } from "@heroui/react";
import { getWithAuth } from "atlas-shared-web";
import CaseDetails from "../../components/cases/case-details";
import { API_BASE } from "../../lib/config";
import { Case } from "../../types/case";

export default function ViewCase() {
  const router = useRouter();
    const { id } = router.query;
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCase = useCallback(async () => {
    try {
      const response = await getWithAuth(`${API_BASE}/network/atlas-cases/v1/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCaseData(data);
      }
    } catch (error) {
      console.error("Failed to fetch case:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchCase();
    }
  }, [id, fetchCase]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Case not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="flat" onPress={() => router.push("/")}>
            Back to Cases
          </Button>
        </div>
        <CaseDetails caseData={caseData} />
      </div>
    </div>
  );
}
