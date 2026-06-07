import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Button, Spinner, Card, CardHeader, CardBody } from "@heroui/react";
import { AlertModal, useAuth, getWithAuth, putWithAuth } from "atlas-shared-web";
import { getStatusStyle } from "atlas-shared-web";
import { PencilSquareIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import {
  InternetServiceRes,
  InternetServiceType,
} from "../../types/internet-service";
import { API_BASE } from "../../lib/config";
import { useInternetServiceConfigs } from "../../hooks/useInternetServiceConfigs";
import { useRack } from "../../hooks/useRack";

export default function ViewInternetService() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const isInternalUser = user?.internal ?? false;
  const configs = useInternetServiceConfigs(isInternalUser);

  const [internetService, setInternetService] = useState<InternetServiceRes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; type: "success" | "error" } | null>(null);

  const { rackInfo } = useRack(internetService?.rack_id);

  const fetchInternetService = useCallback(async () => {
    if (!id) return;
    try {
      const response = await getWithAuth(`${API_BASE}/network/internet-services/v1/${id}`);
      if (response.ok) {
        const data = await response.json();
        setInternetService(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setAlertMessage(errorData.detail || "Internet service not found.");
      }
    } catch (error) {
      console.error("Failed to fetch internet service:", error);
      setAlertMessage("Failed to fetch internet service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!id) {
      router.push("/internet-services");
      return;
    }
    fetchInternetService();
  }, [router.isReady, id, fetchInternetService]);

  const handleSubmitForApproval = async () => {
    if (!internetService) return;
    setIsSubmitting(true);
    try {
      const response = await putWithAuth(
        `${API_BASE}/network/internet-services/v1/${internetService.internet_service_id}/status`,
        {
          entity_type: "INTERNET_SERVICE",
          entity_id: internetService.internet_service_id,
          status: "PENDING_APPROVAL",
          remark: "Submitted via portal",
        }
      );
      if (response.ok) {
        setAlert({ title: "Success", message: "Request submitted for approval.", type: "success" });
        fetchInternetService();
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

  const calculateTotals = (data: InternetServiceRes) => {
    let totalMonthly = 0;
    let totalOnetime = 0;

    // Main service fee
    if (data.service_type && data.bandwidth) {
      const fee = configs.getServiceFee(data.service_type, data.bandwidth);
      totalMonthly += fee.monthly * data.quantity;
      totalOnetime += fee.onetime * data.quantity;
    }

    // BGP Routing
    if (data.bgp_routing_lines > 0) {
      const fee = configs.getAddonFee("bgp_routing_lines");
      totalMonthly += fee.monthly * data.bgp_routing_lines;
      totalOnetime += fee.onetime * data.bgp_routing_lines;
    }

    // DNS Hosting
    if (data.dns_hosting_domains > 0) {
      const fee = configs.getAddonFee("dns_hosting_domains");
      totalMonthly += fee.monthly * data.dns_hosting_domains;
      totalOnetime += fee.onetime * data.dns_hosting_domains;
    }

    // BGP/IP SEC Configuration
    if (data.bgp_ipsec_configuration) {
      totalOnetime += configs.getAddonFee("bgp_ipsec_configuration").onetime;
    }

    // Router Maintenance
    if (data.router_maintenance && data.service_type) {
      totalOnetime += configs.getRouterMaintenanceFee(data.service_type as InternetServiceType);
    }

    // Express Provisioning
    if (data.express_provisioning) {
      totalOnetime += configs.getAddonFee("express_provisioning").onetime;
    }

    return { totalMonthly, totalOnetime };
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

  if (!internetService) {
    return null;
  }

  const statusKey = internetService.internet_service_status || "DRAFT";
  const isDraft = statusKey === "DRAFT";

  const serviceTypeDef = configs.serviceTypeDefinitions[internetService.service_type];
  const { totalMonthly, totalOnetime } = calculateTotals(internetService);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Internet Service Request</h1>
            <p className="text-sm text-gray-500">Internet Service ID: {internetService.internet_service_id}</p>
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
                  onPress={() => router.push(`/internet-services/create?id=${internetService.internet_service_id}`)}
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
                onPress={() => router.push(`/internet-services/edit?id=${internetService.internet_service_id}`)}
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
                <p className="text-base">{internetService.rack_id || "—"}</p>
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
                <p className="text-base">{internetService.client_name || "—"}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Internet Service Summary Card */}
        <Card className="mb-6">
          <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
            <h3 className="text-base font-medium">Internet Service Summary</h3>
          </CardHeader>
          <CardBody className="px-0 py-0">
            {/* Start Date */}
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subscription Start Date</p>
              <p className="text-base">{internetService.start_date || "—"}</p>
            </div>

            {/* Service Details Table */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Item</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Qty</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Monthly</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">One-time</th>
                </tr>
              </thead>
              <tbody>
                {/* Main Service */}
                {internetService.service_type && internetService.bandwidth && (
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {serviceTypeDef?.label} ({serviceTypeDef?.description})
                      </p>
                      <p className="text-sm text-gray-500">
                        Bandwidth: {internetService.bandwidth}
                      </p>
                      <p className="text-sm text-gray-500">
                        Router: {serviceTypeDef?.router}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">{internetService.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      {(() => {
                        const fee = configs.getServiceFee(internetService.service_type, internetService.bandwidth);
                        return `SGD ${(fee.monthly * internetService.quantity).toLocaleString()}`;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(() => {
                        const fee = configs.getServiceFee(internetService.service_type, internetService.bandwidth);
                        return `SGD ${(fee.onetime * internetService.quantity).toLocaleString()}`;
                      })()}
                    </td>
                  </tr>
                )}

                {/* BGP Routing */}
                {internetService.bgp_routing_lines > 0 && (
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <p className="font-medium">BGP Routing per line</p>
                    </td>
                    <td className="px-4 py-3 text-right">{internetService.bgp_routing_lines}</td>
                    <td className="px-4 py-3 text-right">
                      SGD {(configs.getAddonFee("bgp_routing_lines").monthly * internetService.bgp_routing_lines).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      SGD {(configs.getAddonFee("bgp_routing_lines").onetime * internetService.bgp_routing_lines).toLocaleString()}
                    </td>
                  </tr>
                )}

                {/* DNS Hosting */}
                {internetService.dns_hosting_domains > 0 && (
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <p className="font-medium">DNS Hosting per domain</p>
                    </td>
                    <td className="px-4 py-3 text-right">{internetService.dns_hosting_domains}</td>
                    <td className="px-4 py-3 text-right">
                      SGD {(configs.getAddonFee("dns_hosting_domains").monthly * internetService.dns_hosting_domains).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      SGD {(configs.getAddonFee("dns_hosting_domains").onetime * internetService.dns_hosting_domains).toLocaleString()}
                    </td>
                  </tr>
                )}

                {/* BGP/IP SEC Configuration */}
                {internetService.bgp_ipsec_configuration && (
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <p className="font-medium">BGP Routing or IP SEC configuration</p>
                      <ul className="text-sm text-gray-500 list-disc list-inside">
                        <li>Configuration during office hours. (subject to confirmation after discussion on scope of work)</li>
                        <li>1 hour of remote hand charges (estimated SGD 400) apply for after office-hours configuration.</li>
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-right">1</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">SGD {configs.getAddonFee("bgp_ipsec_configuration").onetime.toLocaleString()}</td>
                  </tr>
                )}

                {/* Router Maintenance */}
                {internetService.router_maintenance && internetService.service_type && (
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <p className="font-medium">24 x 7 x 4 Annual Router Maintenance Fee</p>
                      <p className="text-sm text-gray-500">{serviceTypeDef?.router}</p>
                    </td>
                    <td className="px-4 py-3 text-right">1</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">
                      <div>SGD {configs.getRouterMaintenanceFee(internetService.service_type as InternetServiceType).toLocaleString()}</div>
                      <div className="text-sm text-gray-500">(annually)</div>
                    </td>
                  </tr>
                )}

                {/* Express Provisioning */}
                {internetService.express_provisioning && (
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <p className="font-medium">Express Provisioning</p>
                    </td>
                    <td className="px-4 py-3 text-right">1</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">SGD {configs.getAddonFee("express_provisioning").onetime.toLocaleString()}</td>
                  </tr>
                )}
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
                {internetService.remark || "—"}
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
                    {internetService.create_time ? new Date(internetService.create_time).toLocaleString() : "-"}
                  </p>
                  <p className="text-sm text-gray-500">By: {internetService.creater_name || "-"}</p>
                </div>
              </div>
              {internetService.update_time && internetService.update_time !== internetService.create_time && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Request Updated</p>
                    <p className="text-sm text-gray-500">
                      {new Date(internetService.update_time).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">By: {internetService.updater_name || "-"}</p>
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
          router.push("/internet-services");
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
