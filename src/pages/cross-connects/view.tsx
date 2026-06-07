import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  Button,
  Spinner,
} from "@heroui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { AlertModal } from "atlas-shared-web/components";
import { getStatusStyle, getWithAuth } from "atlas-shared-web";
import CrossConnectDetails from "../../components/cross-connects/cross-connect-details";
import { API_BASE } from "../../lib/config";
import { CrossConnect } from "../../types/cross-connect";

export default function ViewCrossConnect() {
  const router = useRouter();
    const [crossConnect, setCrossConnect] = useState<CrossConnect | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const id = router.query.id as string;

  const fetchCrossConnect = useCallback(async () => {
    try {
      const response = await getWithAuth(`${API_BASE}/network/cross-connects/v1/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCrossConnect(data);
      } else {
        setAlertMessage("Cross-connect not found.");
        setShouldRedirect(true);
      }
    } catch (error) {
      console.error("Failed to fetch cross-connect:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!router.isReady) return;

    if (!id) {
      router.push("/cross-connects");
      return;
    }

    fetchCrossConnect();
  }, [router.isReady, id, router, fetchCrossConnect]);

  const handleAcknowledge = async () => {
    console.log("Acknowledge clicked");
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });
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

  if (!crossConnect) {
    return null;
  }

  const statusKey = crossConnect.cross_connect_status || "DRAFT";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">
              Request for Cross-Connection
            </h1>
            <p className="text-sm text-gray-500">{crossConnect.cross_connect_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="flat"
              onPress={() => router.push("/cross-connects")}
            >
              Back
            </Button>
            <Button
              color="success"
              startContent={<CheckIcon className="w-4 h-4" />}
              onPress={handleAcknowledge}
            >
              Acknowledge
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <span className={getStatusStyle(statusKey)}>
            {statusKey.replace(/_/g, " ")}
          </span>
          <span className="text-sm text-gray-500">
            {formatDate(crossConnect.update_time || crossConnect.create_time)}
          </span>
        </div>

        <CrossConnectDetails crossConnect={crossConnect} />
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
