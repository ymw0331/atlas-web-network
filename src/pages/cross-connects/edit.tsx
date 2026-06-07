import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Spinner } from "@heroui/react";
import { AlertModal, getWithAuth, putWithAuth } from "atlas-shared-web";
import { API_BASE } from "../../lib/config";
import { CrossConnect, CrossConnectApiPayload, CrossConnectRequestForm } from "../../types/cross-connect";
import CrossConnectForm from "../../components/cross-connects/cross-connect-form";

export default function EditCrossConnect() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<CrossConnectRequestForm> | undefined>();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const id = router.query.id as string;

  const fetchCrossConnect = useCallback(async () => {
    try {
      const response = await getWithAuth(`${API_BASE}/network/cross-connects/v1/${id}`);
      if (response.ok) {
        const data: CrossConnect = await response.json();
        setInitialData({
          source_rack_id: data.source_rack_id,
          source_client_id: data.source_client_id || "",
          source_client_name: data.source_client_name || "",
          target_rack_id: data.target_rack_id,
          target_client_id: data.target_client_id || "",
          target_client_name: data.target_client_name || "",
          remark: data.remark || "",
          express_provisioning: data.express_provisioning || false,
        });
      } else {
        setAlertMessage("Cross-connect not found.");
        setShouldRedirect(true);
      }
    } catch (error) {
      console.error("Failed to fetch cross-connect:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!router.isReady) return;

    if (!id) {
      router.push("/cross-connects");
      return;
    }

    fetchCrossConnect();
  }, [router.isReady, id, router, fetchCrossConnect]);

  const handleSubmit = async (payload: CrossConnectApiPayload) => {
    setIsSubmitting(true);
    try {
      const response = await putWithAuth(`${API_BASE}/network/cross-connects/v1/${id}/draft`, payload);
      if (response.ok) {
        router.push("/cross-connects");
      } else {
        const error = await response.json();
        setAlertMessage(error.detail || "Failed to update cross-connect");
      }
    } catch (error) {
      console.error("Failed to update cross-connect:", error);
      setAlertMessage("Failed to update cross-connect");
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <CrossConnectForm
          mode="edit"
          crossConnectId={id}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/cross-connects")}
          isSubmitting={isSubmitting}
        />
      </div>
      <AlertModal
        isOpen={!!alertMessage}
        onClose={() => {
          setAlertMessage(null);
          if (shouldRedirect) router.push("/cross-connects");
        }}
        title="Error"
        message={alertMessage || ""}
        buttonColor="danger"
      />
    </div>
  );
}
