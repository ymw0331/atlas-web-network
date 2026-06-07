import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Spinner } from "@heroui/react";
import { AlertModal } from "atlas-shared-web/components";
import { getWithAuth } from "atlas-shared-web";
import TimeServiceForm from "../../components/time-services/time-service-form";
import { TimeServiceFormData, TimeServiceRes, TimeServiceFormItem } from "../../types/time-service";
import { API_BASE } from "../../lib/config";

const initialFormData: TimeServiceFormData = {
  rack_id: "",
  start_date: "",
  services: [],
  remark: "",
};

// Convert API response to form data
const fromApiResponse = (data: TimeServiceRes): TimeServiceFormItem => ({
  service_type: data.service_type,
  connector_type: data.connector_type || undefined,
  quantity: data.quantity,
});

export default function CreateTimeService() {
  const router = useRouter();
  const { id, rack_id } = router.query;

  const [formData, setFormData] = useState<TimeServiceFormData>(initialFormData);
  const [timeServiceIds, setTimeServiceIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    // Skip fetch if timeServiceIds are already set (draft was just created)
    if (timeServiceIds.length > 0) return;

    // If rack_id is provided in URL, pre-select it
    if (rack_id && typeof rack_id === "string") {
      setFormData((prev) => ({ ...prev, rack_id }));
    }

    // If id is provided, load existing draft
    if (id && typeof id === "string") {
      setIsLoading(true);
      getWithAuth(`${API_BASE}/network/time-services/v1/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load draft");
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
          console.error("Failed to load draft:", error);
          setAlertMessage("Failed to load draft. Please try again.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [router.isReady, id, rack_id, timeServiceIds.length]);

  const handleDraftCreated = (ids: string[]) => {
    setTimeServiceIds(ids);
    if (ids.length > 0) {
      router.replace(`/time-services/create?id=${ids[0]}`, undefined, { shallow: true });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const title = "New Time Service Request";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <TimeServiceForm
        initialData={formData}
        timeServiceIds={timeServiceIds}
        mode="create"
        title={title}
        onDraftCreated={handleDraftCreated}
      />
      <AlertModal
        isOpen={!!alertMessage}
        onClose={() => setAlertMessage(null)}
        title="Error"
        message={alertMessage || ""}
        buttonColor="danger"
      />
    </div>
  );
}
