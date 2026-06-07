import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Spinner } from "@heroui/react";
import { AlertModal } from "atlas-shared-web/components";
import { getWithAuth } from "atlas-shared-web";
import CoLocationForm from "../../components/co-location/co-location-form";
import { ColoFormData, CoLocationRes } from "../../types/co-location";
import { API_BASE } from "../../lib/config";

const initialFormData: ColoFormData = {
  startDate: "",
  rackSpecs: {
    power_strips_by_atlas: true,
    subscriber_customers: undefined,
    racks: [],
  },
  networkTradingApp: {
    dedicated_multicast_market_data_fiber: undefined,
    trading_and_market_data_fiber: undefined,
    trading_and_market_data_fiber_handoff: undefined,
  },
  networkNonTradingApp: {
    all_non_trading_apps_fiber_handoff: undefined,
    single_non_trading_apps_fiber_handoff: undefined,
    single_non_trading_apps: [],
    test_env_fiber_handoff: undefined,
  },
  networkGiftConnect: {
    gift_connect_or_colo_rack_in_nse_ifsc_fiber_handoff: undefined,
    gift_connect_mtbt_over_wan_feed_from_atlas_colo_rack_fiber_handoff: undefined,
    gift_connect_additional_1_mbps_of_intl_bandwidth_to_gift_system: undefined,
    gift_connect_additional_1_mbps_of_intl_bandwidth_to_gift_colo_rack: undefined,
  },
  remoteHandsServices: {
    remote_hands_monthly_subscription_bundle_per_hour: undefined,
    remote_hands_additional_service_request_during_office_hours: true,
    remote_hands_additional_service_request_during_non_office_hours: true,
  },
  remarks: "",
};

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

export default function CreateCoLocation() {
  const router = useRouter();
    const { id } = router.query;

  const [formData, setFormData] = useState<ColoFormData>(initialFormData);
  const [coLocationId, setCoLocationId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    // Skip fetch if coLocationId is already set (draft was just created)
    if (coLocationId) return;

    if (id && typeof id === "string") {
      setIsLoading(true);
      getWithAuth(`${API_BASE}/network/co-locations/v1/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load draft");
          return res.json();
        })
        .then((data: CoLocationRes) => {
          setFormData(fromApiResponse(data));
          setCoLocationId(data.co_location_id);
        })
        .catch((error) => {
          console.error("Failed to load draft:", error);
          setAlertMessage("Failed to load draft. Please try again.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [router.isReady, id, coLocationId]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const title = coLocationId ? "Edit Co-Location Request" : "New Co-Location Request";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <CoLocationForm
        initialData={formData}
        coLocationId={coLocationId}
        mode="create"
        title={title}
        onDraftCreated={setCoLocationId}
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
