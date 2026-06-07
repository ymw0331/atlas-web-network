import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Spinner } from "@heroui/react";
import { AlertModal } from "atlas-shared-web/components";
import { getWithAuth } from "atlas-shared-web";
import InternetServiceForm from "../../components/internet-services/internet-service-form";
import { InternetServiceFormData, InternetServiceRes, INITIAL_FORM_DATA } from "../../types/internet-service";
import { API_BASE } from "../../lib/config";

// Convert API response to form data
const fromApiResponse = (data: InternetServiceRes): InternetServiceFormData => ({
  rack_id: data.rack_id,
  start_date: data.start_date || "",
  service_type: data.service_type,
  bandwidth: data.bandwidth,
  quantity: data.quantity,
  remark: data.remark || "",
  bgp_routing_lines: data.bgp_routing_lines || 0,
  dns_hosting_domains: data.dns_hosting_domains || 0,
  bgp_ipsec_configuration: data.bgp_ipsec_configuration || false,
  router_maintenance: data.router_maintenance || false,
  express_provisioning: data.express_provisioning || false,
});

export default function CreateInternetService() {
  const router = useRouter();
  const { id, rack_id } = router.query;

  const [formData, setFormData] = useState<InternetServiceFormData>(INITIAL_FORM_DATA);
  const [internetServiceId, setInternetServiceId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    // Skip fetch if internetServiceId is already set (draft was just created)
    if (internetServiceId) return;

    // If rack_id is provided in URL, pre-select it
    if (rack_id && typeof rack_id === "string") {
      setFormData((prev) => ({ ...prev, rack_id }));
    }

    // If id is provided, load existing draft
    if (id && typeof id === "string") {
      setIsLoading(true);
      getWithAuth(`${API_BASE}/network/internet-services/v1/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load draft");
          return res.json();
        })
        .then((data: InternetServiceRes) => {
          setFormData(fromApiResponse(data));
          setInternetServiceId(data.internet_service_id);
        })
        .catch((error) => {
          console.error("Failed to load draft:", error);
          setAlertMessage("Failed to load draft. Please try again.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [router.isReady, id, rack_id, internetServiceId]);

  const handleDraftCreated = (newId: string) => {
    setInternetServiceId(newId);
    router.replace(`/internet-services/create?id=${newId}`, undefined, { shallow: true });
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

  const title = "New Internet Service Request";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <InternetServiceForm
        initialData={formData}
        internetServiceId={internetServiceId}
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
