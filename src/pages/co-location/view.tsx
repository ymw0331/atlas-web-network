import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Button, Spinner, Card, CardHeader, CardBody, Tabs, Tab } from "@heroui/react";
import { AlertModal, useAuth, getWithAuth, putWithAuth } from "atlas-shared-web";
import { getStatusStyle } from "atlas-shared-web";
import { PencilSquareIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { CoLocationRes, NetworkTradingApp, NetworkNonTradingApp, NetworkGiftConnect, RemoteHandsServices } from "../../types/co-location";
import { API_BASE } from "../../lib/config";
import { useColocationConfigs } from "../../hooks/useColocationConfigs";
import FeeSummaryTable from "../../components/co-location/fee-summary-table";

interface ReviewItem<T> {
  field: keyof T;
  title: string;
}

const TRADING_ITEMS: ReviewItem<NetworkTradingApp>[] = [
  { field: "dedicated_multicast_market_data_fiber", title: "Dedicated Multicast Market Data" },
  { field: "trading_and_market_data_fiber", title: "Trading and Market Data - 10 GB" },
  { field: "trading_and_market_data_fiber_handoff", title: "Trading and Market Data" },
];

const NON_TRADING_ITEMS: ReviewItem<NetworkNonTradingApp>[] = [
  { field: "all_non_trading_apps_fiber_handoff", title: "All Non-Trading Applications including Backoffice Services" },
  { field: "single_non_trading_apps_fiber_handoff", title: "Single Non-Trading Application" },
  { field: "test_env_fiber_handoff", title: "Test Environment" },
];

const GIFT_ITEMS: ReviewItem<NetworkGiftConnect>[] = [
  { field: "gift_connect_or_colo_rack_in_nse_ifsc_fiber_handoff", title: "GIFT Connect System/Co-Lo rack in NSE IFSC" },
  { field: "gift_connect_mtbt_over_wan_feed_from_atlas_colo_rack_fiber_handoff", title: "GIFT Connect MTBT over WAN feed from ATLAS Co-Location rack" },
  { field: "gift_connect_additional_1_mbps_of_intl_bandwidth_to_gift_system", title: "Additional 1 Mbps of international bandwidth to GIFT Connect System" },
  { field: "gift_connect_additional_1_mbps_of_intl_bandwidth_to_gift_colo_rack", title: "Additional 1 Mbps of international bandwidth to GIFT Connect co-location rack." },
];

const REMOTE_HANDS_ITEMS: ReviewItem<RemoteHandsServices>[] = [
  { field: "remote_hands_monthly_subscription_bundle_per_hour", title: "Monthly subscription bundle per 1 hour service request" },
];

export default function ViewCoLocation() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const isInternalUser = user?.internal ?? false;
  const configs = useColocationConfigs(isInternalUser);

  const [coLocation, setCoLocation] = useState<CoLocationRes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; type: "success" | "error" } | null>(null);

  const fetchCoLocation = useCallback(async () => {
    if (!id) return;
    try {
      const response = await getWithAuth(`${API_BASE}/network/co-locations/v1/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCoLocation(data);
      } else {
        setAlertMessage("Co-location not found.");
      }
    } catch (error) {
      console.error("Failed to fetch co-location:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!id) {
      router.push("/co-location");
      return;
    }
    fetchCoLocation();
  }, [router.isReady, id, fetchCoLocation]);

  const handleSubmitForApproval = async () => {
    if (!coLocation) return;
    setIsSubmitting(true);
    try {
      const response = await putWithAuth(
        `${API_BASE}/network/co-locations/v1/${coLocation.co_location_id}/status`,
        {
          entity_type: "CO_LOCATION",
          entity_id: coLocation.co_location_id,
          status: "PENDING_APPROVAL",
          remark: "Submitted via portal",
        }
      );
      if (response.ok) {
        setAlert({ title: "Success", message: "Request submitted for approval.", type: "success" });
        fetchCoLocation();
      } else {
        const error = await response.json();
        setAlert({ title: "Error", message: error.detail || "Failed to submit for approval", type: "error" });
      }
    } catch (error) {
      console.error("Failed to submit for approval:", error);
      setAlert({ title: "Error", message: "Failed to submit for approval", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getColocationFee = (fieldName: string) => {
    const monthlyKey = `MONTHLY@${fieldName}`;
    const onetimeKey = `ONETIME@${fieldName}`;
    return {
      monthly: configs.prices[monthlyKey] ? Number(configs.prices[monthlyKey]) : 0,
      onetime: configs.prices[onetimeKey] ? Number(configs.prices[onetimeKey]) : 0,
    };
  };

  const renderFee = (fee: { monthly: number; onetime: number }) => {
    if (!fee.monthly && !fee.onetime) return null;
    return (
      <p className="text-sm text-gray-500">
        {fee.monthly > 0 && <span>Monthly Fee: SGD {fee.monthly.toLocaleString()}</span>}
        {fee.monthly > 0 && fee.onetime > 0 && " | "}
        {fee.onetime > 0 && <span>One-time Fee: SGD {fee.onetime.toLocaleString()}</span>}
      </p>
    );
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

  if (!coLocation) {
    return null;
  }

  const statusKey = coLocation.co_location_status || "DRAFT";
  const isDraft = statusKey === "DRAFT";
  const isPendingApproval = statusKey === "PENDING_APPROVAL";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Co-Location Request</h1>
            <p className="text-sm text-gray-500">Co-Location ID: {coLocation.co_location_id}</p>
          </div>
          <div className="flex items-center gap-2">
            {isDraft ? (
              <>
                <Button
                  color="primary"
                  variant="bordered"
                  startContent={<PencilSquareIcon className="w-4 h-4" />}
                  onPress={() => router.push(`/co-location/create?id=${coLocation.co_location_id}`)}
                >
                  Continue Editing
                </Button>
                <Button
                  color="primary"
                  startContent={<PaperAirplaneIcon className="w-4 h-4" />}
                  onPress={handleSubmitForApproval}
                  isLoading={isSubmitting}
                >
                  Submit for Approval
                </Button>
              </>
            ) : (
              <Button
                color="primary"
                variant="bordered"
                startContent={<PencilSquareIcon className="w-4 h-4" />}
                onPress={() => router.push(`/co-location/edit?id=${coLocation.co_location_id}`)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4 mb-6">
          <span className={getStatusStyle(statusKey)}>
            {statusKey.replace(/_/g, " ")}
          </span>
          <span className="text-sm text-gray-500">
            Last updated: {formatDate(coLocation.update_time || coLocation.create_time)}
          </span>
        </div>

        {/* Subscription Details */}
        <Card className="mb-4">
          <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
            <h2 className="text-base font-medium">Subscription Details</h2>
          </CardHeader>
          <CardBody className="px-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Client</p>
                <p className="font-medium">{coLocation.client_name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Start Date</p>
                <p className="font-medium">{formatDate(coLocation.start_date)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tabs */}
        <Tabs aria-label="Co-Location Details" variant="solid" color="primary" classNames={{ tabList: "mb-4 p-1 bg-white dark:bg-gray-800 rounded-lg" }}>
          {/* Tab 1: Rack Specification */}
          <Tab key="rack" title="Rack Specification">
            <Card className="mb-4">
              <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
                <h3 className="text-base font-medium">Rack Specification</h3>
              </CardHeader>
              <CardBody className="px-4 py-4 space-y-6">
                {/* Racks */}
                <div>
                  <h4 className="text-base font-semibold mb-3">Racks</h4>
                  {coLocation.rackSpecs.racks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No racks added</p>
                  ) : (
                    <div className="space-y-3">
                      {coLocation.rackSpecs.racks.map((rack, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="grid grid-cols-4 gap-4 mb-3">
                                <div>
                                  <p className="text-sm text-gray-500">Rack ID</p>
                                  <p className="font-medium">{rack.rack_id || "-"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Rack Tier</p>
                                  <p className="font-medium">{configs.rackTierOptions[rack.rack_tier] || rack.rack_tier}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Rack Type</p>
                                  <p className="font-medium">{configs.rackTypeOptions[rack.rack_type] || rack.rack_type?.replace("_", " ")}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Power</p>
                                  <p className="font-medium">{configs.rackPowerOptions[rack.power] || rack.power?.replace(/_/g, " ")}</p>
                                </div>
                              </div>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-gray-500">Add on: Upgrade Standard Full Rack to 800mm Width:</span> <span className="font-medium">{rack.is_800mm_width_full_rack ? "Yes" : "No"}</span></p>
                                <p><span className="text-gray-500">Reserve Standard Full Rack next to existing Subscriber Rack:</span> <span className="font-medium">{rack.reserve_standard_full_rack ?? 0}</span></p>
                                <p><span className="text-gray-500">Reserve 800mm Full Rack next to existing Subscriber Rack:</span> <span className="font-medium">{rack.reserve_800mm_full_rack ?? 0}</span></p>
                              </div>
                            </div>
                            {/* Show Assign Rack button for internal users when rack_id is blank and status is pending approval */}
                            {isInternalUser && !rack.rack_id && isPendingApproval && (
                              <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                className="ml-4"
                                onPress={() => router.push(`/co-location/edit?id=${coLocation.co_location_id}&assignRack=${index}`)}
                              >
                                Assign Rack
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Subscriber Customers */}
                <div>
                  <h4 className="text-base font-semibold mb-3">Utilisation by Subscriber Customers</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">Subscriber Racks utilised by Subscriber Customers</p>
                      {renderFee(getColocationFee("subscriber_customers"))}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Quantity</p>
                      <p className="font-medium">{coLocation.rackSpecs.subscriber_customers ?? 0}</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* Tab 2: Network */}
          <Tab key="network" title="Network">
            {/* Network to ATLAS Card */}
            <Card className="mb-4">
              <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
                <h3 className="text-base font-medium">Network to ATLAS</h3>
              </CardHeader>
              <CardBody className="px-0 py-0">
                {/* Trading Section */}
                <div className="p-6">
                  <h4 className="text-base font-semibold mb-4">Network to ATLAS Securities / Derivatives Trading</h4>
                  <div className="space-y-3">
                    {TRADING_ITEMS.map(item => (
                      <div key={String(item.field)} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.title}</p>
                          {renderFee(getColocationFee(String(item.field)))}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Quantity</p>
                          <p className="font-medium">{(coLocation.networkTradingApp[item.field] as number | null) ?? 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700 mx-6" />

                {/* Non-Trading Section */}
                <div className="p-6">
                  <h4 className="text-base font-semibold mb-4">Network to Non-Trading Applications</h4>
                  <div className="space-y-3">
                    {NON_TRADING_ITEMS.map(item => {
                      const isSingleNonTrading = item.field === "single_non_trading_apps_fiber_handoff";
                      const selectedApps = coLocation.networkNonTradingApp.single_non_trading_apps || [];
                      return (
                        <div key={String(item.field)} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{item.title}</p>
                              {renderFee(getColocationFee(String(item.field)))}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-1">Quantity</p>
                              <p className="font-medium">{(coLocation.networkNonTradingApp[item.field] as number | null) ?? 0}</p>
                            </div>
                          </div>
                          {isSingleNonTrading && selectedApps.length > 0 && (
                            <p className="text-sm text-gray-500 mt-2">
                              {selectedApps.map(key => configs.nonTradingApps[key] || key).join(", ")}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* GIFT Connect Card */}
            <Card className="mb-4">
              <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
                <h3 className="text-base font-medium">Network to GIFT Connect</h3>
              </CardHeader>
              <CardBody className="px-0 py-0">
                <div className="p-6">
                  <div className="space-y-3">
                    {GIFT_ITEMS.map(item => (
                      <div key={String(item.field)} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.title}</p>
                          {renderFee(getColocationFee(String(item.field)))}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Quantity</p>
                          <p className="font-medium">{(coLocation.networkGiftConnect[item.field] as number | null) ?? 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Remote Hands Card */}
            <Card className="mb-4">
              <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
                <h3 className="text-base font-medium">Remote Hands Services</h3>
              </CardHeader>
              <CardBody className="px-0 py-0">
                <div className="p-6">
                  <div className="space-y-3">
                    {REMOTE_HANDS_ITEMS.map(item => (
                      <div key={String(item.field)} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.title}</p>
                          {renderFee(getColocationFee(String(item.field)))}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Quantity</p>
                          <p className="font-medium">{(coLocation.remoteHandsServices[item.field] as number | null) ?? 0}</p>
                        </div>
                      </div>
                    ))}
                    {/* Additional services */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">Additional service request during Office Hours</p>
                        <p className="text-sm text-gray-500 mb-1">From 8 am to 5 pm Singapore hours</p>
                        {renderFee(getColocationFee("remote_hands_additional_service_request_during_office_hours"))}
                      </div>
                      <span className="text-sm text-gray-500">(per request)</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">Additional service request during Non-Office Hours</p>
                        <p className="text-sm text-gray-500 mb-1">From 5 pm to 8 am Singapore hours</p>
                        {renderFee(getColocationFee("remote_hands_additional_service_request_during_non_office_hours"))}
                      </div>
                      <span className="text-sm text-gray-500">(per request)</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* Tab 3: Fee Summary */}
          <Tab key="fees" title="Fee Summary">
            <Card>
              <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
                <h2 className="text-base font-medium">Fee Summary</h2>
              </CardHeader>
              <CardBody className="px-0 py-0">
                <FeeSummaryTable
                  rackSpecs={coLocation.rackSpecs}
                  networkTradingApp={coLocation.networkTradingApp}
                  networkNonTradingApp={coLocation.networkNonTradingApp}
                  networkGiftConnect={coLocation.networkGiftConnect}
                  remoteHandsServices={coLocation.remoteHandsServices}
                  configs={configs}
                />
              </CardBody>
            </Card>
          </Tab>

          {/* Tab 4: Remarks */}
          <Tab key="remarks" title="Remarks">
            <Card>
              <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
                <h3 className="text-base font-medium">Remarks</h3>
              </CardHeader>
              <CardBody className="px-4 py-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[120px]">
                  <p className="text-gray-600 dark:text-gray-400">
                    {coLocation.remarks || "No remarks added."}
                  </p>
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* Tab 5: History */}
          <Tab key="history" title="History">
            <Card>
              <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
                <h3 className="text-base font-medium">History</h3>
              </CardHeader>
              <CardBody className="px-4 py-4">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">Request Created</p>
                      <p className="text-sm text-gray-500">
                        {coLocation.create_time ? new Date(coLocation.create_time).toLocaleString() : "-"}
                      </p>
                      <p className="text-sm text-gray-500">By: {coLocation.creater_name || "-"}</p>
                    </div>
                  </div>
                  {coLocation.update_time && coLocation.update_time !== coLocation.create_time && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Request Updated</p>
                        <p className="text-sm text-gray-500">
                          {new Date(coLocation.update_time).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">By: {coLocation.updater_name || "-"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
      <AlertModal
        isOpen={!!alertMessage}
        onClose={() => {
          setAlertMessage(null);
          router.push("/co-location");
        }}
        title="Error"
        message={alertMessage || ""}
        buttonColor="danger"
      />
      <AlertModal
        isOpen={!!alert}
        onClose={() => setAlert(null)}
        title={alert?.title || ""}
        message={alert?.message || ""}
        buttonColor={alert?.type === "success" ? "success" : "danger"}
      />
    </div>
  );
}
