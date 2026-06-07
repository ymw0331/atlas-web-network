import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Button, Spinner, Card, CardHeader, CardBody } from "@heroui/react";
import { AlertModal, useAuth, getWithAuth, putWithAuth } from "atlas-shared-web";
import { getStatusStyle } from "atlas-shared-web";
import { PencilSquareIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { TimeServiceRes } from "../../types/time-service";
import { API_BASE } from "../../lib/config";
import { useTimeServiceConfigs } from "../../hooks/useTimeServiceConfigs";
import { useRack } from "../../hooks/useRack";

const SERVICE_LABELS: Record<string, { label: string; configKey: string }> = {
  GPS_SIGNAL_SINGLE: {
    label: "GPS Signal Feed – Single",
    configKey: "GPS_SIGNAL_SINGLE",
  },
  GPS_SIGNAL_DUAL: {
    label: "GPS Signal Feed – Dual",
    configKey: "GPS_SIGNAL_DUAL",
  },
  PTP_SINGLE: {
    label: "Precision Time Protocol (PTP) Feed – Single",
    configKey: "PTP_SINGLE",
  },
  PTP_DUAL: {
    label: "Precision Time Protocol (PTP) Feed – Dual",
    configKey: "PTP_DUAL",
  },
};

const CONNECTOR_LABELS: Record<string, string> = {
  BNC: "BNC",
  TNC: "TNC",
  N_TYPE: "N-type",
  SMA: "SMA",
};

export default function ViewTimeService() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const isInternalUser = user?.internal ?? false;
  const configs = useTimeServiceConfigs(isInternalUser);

  const [timeService, setTimeService] = useState<TimeServiceRes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; type: "success" | "error" } | null>(null);

  const { rackInfo } = useRack(timeService?.rack_id);

  const fetchTimeService = useCallback(async () => {
    if (!id) return;
    try {
      const response = await getWithAuth(`${API_BASE}/network/time-services/v1/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTimeService(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setAlertMessage(errorData.detail || "Time service not found.");
      }
    } catch (error) {
      console.error("Failed to fetch time service:", error);
      setAlertMessage("Failed to fetch time service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!id) {
      router.push("/time-services");
      return;
    }
    fetchTimeService();
  }, [router.isReady, id, fetchTimeService]);

  const handleSubmitForApproval = async () => {
    if (!timeService) return;
    setIsSubmitting(true);
    try {
      const response = await putWithAuth(
        `${API_BASE}/network/time-services/v1/${timeService.time_service_id}/status`,
        {
          entity_type: "TIME_SERVICE",
          entity_id: timeService.time_service_id,
          status: "PENDING_APPROVAL",
          remark: "Submitted via portal",
        }
      );
      if (response.ok) {
        setAlert({ title: "Success", message: "Request submitted for approval.", type: "success" });
        fetchTimeService();
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

  const getTimeServiceFee = (configKey: string) => {
    const monthlyKey = `MONTHLY@${configKey}`;
    const onetimeKey = `ONETIME@${configKey}`;
    return {
      monthly: configs.prices[monthlyKey] ? Number(configs.prices[monthlyKey]) : 0,
      onetime: configs.prices[onetimeKey] ? Number(configs.prices[onetimeKey]) : 0,
    };
  };

  const getSpec = (configKey: string): string => {
    return configs.specs[configKey] || "";
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

  if (!timeService) {
    return null;
  }

  const statusKey = timeService.time_service_status || "DRAFT";
  const isDraft = statusKey === "DRAFT";

  const serviceInfo = SERVICE_LABELS[timeService.service_type];
  const fee = serviceInfo ? getTimeServiceFee(serviceInfo.configKey) : { monthly: 0, onetime: 0 };
  const spec = serviceInfo ? getSpec(serviceInfo.configKey) : "";
  const totalMonthly = fee.monthly * timeService.quantity;
  const totalOnetime = fee.onetime * timeService.quantity;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Time Service Request</h1>
            <p className="text-sm text-gray-500">Time Service ID: {timeService.time_service_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={getStatusStyle(statusKey)}>
              {statusKey.replace(/_/g, " ")}
            </span>
            {isDraft ? (
              <>
                <Button
                  color="primary"
                  variant="bordered"
                  startContent={<PencilSquareIcon className="w-4 h-4" />}
                  onPress={() => router.push(`/time-services/create?id=${timeService.time_service_id}`)}
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
                onPress={() => router.push(`/time-services/edit?id=${timeService.time_service_id}`)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Selected Rack Card */}
        <Card className="mb-6">
          <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
            <h3 className="text-base font-medium">Selected Rack</h3>
          </CardHeader>
          <CardBody className="px-4 py-4">
            <div className="flex items-center gap-6">
              <div className="flex-1 max-w-3xs">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rack ID</p>
                <p className="text-base">{timeService.rack_id || "—"}</p>
              </div>
              <div className="flex-1 max-w-3xs">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tier</p>
                <p className="text-base">{rackInfo?.rack_tier || "—"}</p>
              </div>
              <div className="flex-1 max-w-3xs">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</p>
                <p className="text-base">{rackInfo?.rack_type?.replace(/_/g, " ") || "—"}</p>
              </div>
              <div className="flex-1 max-w-3xs">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Power</p>
                <p className="text-base">{rackInfo?.power?.replace(/_/g, " ") || "—"}</p>
              </div>
              <div className="flex-1 max-w-3xs">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Client</p>
                <p className="text-base">{timeService.client_name || "—"}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Time Services Summary Card */}
        <Card className="mb-6">
          <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
            <h3 className="text-base font-medium">Time Services Summary</h3>
          </CardHeader>
          <CardBody className="px-0 py-0">
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subscription Start Date</p>
              <p className="text-base">{timeService.start_date || "—"}</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Service</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Qty</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Monthly</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">One-time</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3">
                    <p className="font-medium">{serviceInfo?.label || timeService.service_type}</p>
                    {spec && <p className="text-sm text-gray-500">{spec}</p>}
                    {timeService.connector_type && (
                      <p className="text-sm text-gray-500">
                        Connector: {CONNECTOR_LABELS[timeService.connector_type] || timeService.connector_type}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{timeService.quantity}</td>
                  <td className="px-4 py-3 text-right">SGD {totalMonthly.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">SGD {totalOnetime.toLocaleString()}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-800 font-medium">
                  <td colSpan={2} className="px-4 py-3 text-right">Total</td>
                  <td className="px-4 py-3 text-right">SGD {totalMonthly.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">SGD {totalOnetime.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </CardBody>
        </Card>

        {/* Remarks Card */}
        <Card className="mb-6">
          <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
            <h3 className="text-base font-medium">Remarks</h3>
          </CardHeader>
          <CardBody className="px-4 py-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[80px]">
              <p className="text-gray-600 dark:text-gray-400">
                {timeService.remark || "—"}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* History Card */}
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
                    {timeService.create_time ? new Date(timeService.create_time).toLocaleString() : "-"}
                  </p>
                  <p className="text-sm text-gray-500">By: {timeService.creater_name || "-"}</p>
                </div>
              </div>
              {timeService.update_time && timeService.update_time !== timeService.create_time && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Request Updated</p>
                    <p className="text-sm text-gray-500">
                      {new Date(timeService.update_time).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">By: {timeService.updater_name || "-"}</p>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
      <AlertModal
        isOpen={!!alertMessage}
        onClose={() => {
          setAlertMessage(null);
          router.push("/time-services");
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
