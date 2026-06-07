import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Spinner } from "@heroui/react";
import { getWithAuth } from "atlas-shared-web";
import TimeServiceForm from "../../components/time-services/time-service-form";
import { TimeServiceFormData, TimeServiceRes, TimeServiceFormItem } from "../../types/time-service";
import { API_BASE } from "../../lib/config";

// Convert API response to form item
const fromApiResponse = (data: TimeServiceRes): TimeServiceFormItem => ({
  service_type: data.service_type,
  connector_type: data.connector_type || undefined,
  quantity: data.quantity,
});

export default function EditTimeService() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState<TimeServiceFormData | null>(null);
  const [timeServiceIds, setTimeServiceIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    if (!id || typeof id !== "string") {
      router.push("/time-services");
      return;
    }

    setIsLoading(true);
    getWithAuth(`${API_BASE}/network/time-services/v1/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load time service");
        return res.json();
      })
      .then((data: TimeServiceRes) => {
        setFormData({
          rack_id: data.rack_id,
          start_date: data.start_date || "",
          services: [fromApiResponse(data)],
          remark: data.remark || "",
        });
        setTimeServiceIds([data.time_service_id]);
      })
      .catch((error) => {
        console.error("Failed to load time service:", error);
        setError("Failed to load time service");
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
          <p className="text-red-500">{error || "Time service not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <TimeServiceForm
        initialData={formData}
        timeServiceIds={timeServiceIds}
        mode="edit"
        title="Time Service Request"
      />
    </div>
  );
}
