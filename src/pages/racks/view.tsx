import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Divider,
} from "@heroui/react";
import { AlertModal } from "atlas-shared-web/components";
import { getStatusStyle, getWithAuth, putWithAuth } from "atlas-shared-web";
import { useAuth } from "atlas-shared-web";
import { API_BASE } from "../../lib/config";
import { Rack } from "../../types/rack";
import { useRackConfigs } from "../../hooks/useRackConfigs";

export default function ViewRack() {
  const router = useRouter();
  const { user } = useAuth();
  const isInternalUser = user?.internal ?? false;
  const configs = useRackConfigs(isInternalUser);
  const [rack, setRack] = useState<Rack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const id = router.query.id as string;

  const fetchRack = useCallback(async () => {
    try {
      const response = await getWithAuth(`${API_BASE}/network/racks/v1/${id}`);
      if (response.ok) {
        const data = await response.json();
        setRack(data);
      } else {
        setAlertMessage("Rack not found.");
        setShouldRedirect(true);
      }
    } catch (error) {
      console.error("Failed to fetch rack:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!router.isReady) return;

    if (!id) {
      router.push("/racks");
      return;
    }

    fetchRack();
  }, [router.isReady, id, router, fetchRack]);

  const submitForApproval = async () => {
    if (!rack) return;
    setIsSubmitting(true);
    try {
      const response = await putWithAuth(`${API_BASE}/network/racks/v1/${rack.rack_id}/status`, {
        entity_type: "RACK",
        entity_id: rack.rack_id,
        status: "PENDING_APPROVAL",
        remark: "Submitted for approval",
      });
      if (response.ok) {
        fetchRack();
      } else {
        const error = await response.json();
        setAlertMessage(error.detail || "Failed to submit for approval");
      }
    } catch (error) {
      console.error("Failed to submit for approval:", error);
      setAlertMessage("Failed to submit for approval");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || configs.isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!rack) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader className="flex justify-between items-center px-6 pt-6">
            <div>
              <h1 className="text-2xl font-bold">Rack {rack.rack_id}</h1>
              <p className="text-gray-500 text-sm">Rack Details</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="flat"
                onPress={() => router.push("/racks")}
              >
                Back
              </Button>
              <Button
                color="primary"
                onPress={() => router.push(`/racks/edit?id=${id}`)}
              >
                Edit
              </Button>
              {rack.rack_status?.toUpperCase() === "DRAFT" && (
                <Button
                  color="success"
                  isLoading={isSubmitting}
                  onPress={submitForApproval}
                >
                  Submit for Approval
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Rack ID</label>
                  <p className="font-medium">{rack.rack_id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p>
                    <span className={getStatusStyle(rack.rack_status)}>
                      {rack.rack_status?.toUpperCase().replace(/_/g, " ")}
                    </span>
                  </p>
                </div>
              </div>

              <Divider />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Tier</label>
                  <p className="font-medium">{configs.tierOptions[rack.rack_tier] || rack.rack_tier?.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Type</label>
                  <p className="font-medium">{configs.typeOptions[rack.rack_type] || rack.rack_type?.replace("_", " ")}</p>
                </div>
              </div>

              <Divider />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Power</label>
                  <p className="font-medium">{configs.powerOptions[rack.power] || rack.power?.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">800mm Width Full Rack</label>
                  <p className="font-medium">{rack.is_800mm_width_full_rack ? "Yes" : "No"}</p>
                </div>
              </div>

              <Divider />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Reserve Standard Full Rack next to existing Subscriber Rack</label>
                  <p className="font-medium">{rack.reserve_standard_full_rack ?? "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Reserve 800mm Full Rack next to existing Subscriber Rack</label>
                  <p className="font-medium">{rack.reserve_800mm_full_rack ?? "-"}</p>
                </div>
              </div>

              <Divider />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Client</label>
                  <p className="font-medium">{rack.client_name || "Unassigned"}</p>
                  {rack.client_id && (
                    <p className="text-sm text-gray-400">{rack.client_id}</p>
                  )}
                </div>
              </div>

              <Divider />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Created By</label>
                  <p className="font-medium">{rack.creater_name}</p>
                  <p className="text-sm text-gray-400">
                    {rack.create_time ? new Date(rack.create_time).toLocaleString() : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Updated By</label>
                  <p className="font-medium">{rack.updater_name}</p>
                  <p className="text-sm text-gray-400">
                    {rack.update_time ? new Date(rack.update_time).toLocaleString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      <AlertModal
        isOpen={!!alertMessage}
        onClose={() => {
          setAlertMessage(null);
          if (shouldRedirect) router.push("/racks");
        }}
        title="Error"
        message={alertMessage || ""}
        buttonColor="danger"
      />
    </div>
  );
}
