import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Spinner } from "@heroui/react";
import { getWithAuth } from "atlas-shared-web";
import CoLocationForm from "../../components/co-location/co-location-form";
import { ColoFormData, CoLocationRes } from "../../types/co-location";
import { API_BASE } from "../../lib/config";

// Convert API response to form data
const fromApiResponse = (data: CoLocationRes): ColoFormData => ({
  client_id: data.client_id,
  client_name: data.client_name,
  startDate: data.start_date || "",
  rackSpecs: data.rackSpecs,
  networkTradingApp: data.networkTradingApp,
  networkNonTradingApp: data.networkNonTradingApp,
  networkGiftConnect: data.networkGiftConnect,
  remoteHandsServices: data.remoteHandsServices,
  remarks: "",
});

export default function EditCoLocation() {
  const router = useRouter();
    const { id } = router.query;

  const [formData, setFormData] = useState<ColoFormData | null>(null);
  const [coLocationId, setCoLocationId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    if (!id || typeof id !== "string") {
      router.push("/co-location");
      return;
    }

    setIsLoading(true);
    getWithAuth(`${API_BASE}/network/co-locations/v1/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load co-location");
        return res.json();
      })
      .then((data: CoLocationRes) => {
        setFormData(fromApiResponse(data));
        setCoLocationId(data.co_location_id);
      })
      .catch((error) => {
        console.error("Failed to load co-location:", error);
        setError("Failed to load co-location");
      })
      .finally(() => setIsLoading(false));
  }, [router.isReady, id, router]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-96">
          <p className="text-red-500">{error || "Co-location not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <CoLocationForm
        initialData={formData}
        coLocationId={coLocationId}
        mode="edit"
        title="Edit Co-Location Request"
      />
    </div>
  );
}
