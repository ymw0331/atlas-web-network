import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Spinner } from "@heroui/react";
import { getWithAuth } from "atlas-shared-web";
import InternetServiceForm from "../../components/internet-services/internet-service-form";
import { InternetServiceFormData, InternetServiceRes } from "../../types/internet-service";
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

export default function EditInternetService() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState<InternetServiceFormData | null>(null);
  const [internetServiceId, setInternetServiceId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    if (!id || typeof id !== "string") {
      router.push("/internet-services");
      return;
    }

    setIsLoading(true);
    getWithAuth(`${API_BASE}/network/internet-services/v1/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load internet service");
        return res.json();
      })
      .then((data: InternetServiceRes) => {
        setFormData(fromApiResponse(data));
        setInternetServiceId(data.internet_service_id);
      })
      .catch((error) => {
        console.error("Failed to load internet service:", error);
        setError("Failed to load internet service");
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
          <p className="text-red-500">{error || "Internet service not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <InternetServiceForm
        initialData={formData}
        internetServiceId={internetServiceId}
        mode="edit"
        title="Internet Service Request"
      />
    </div>
  );
}
