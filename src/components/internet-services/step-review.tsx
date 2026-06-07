import { Textarea, Card, CardHeader, CardBody } from "@heroui/react";
import {
  InternetServiceFormData,
  InternetServiceType,
} from "../../types/internet-service";
import { InternetServiceConfigs } from "../../hooks/useInternetServiceConfigs";

interface StepReviewProps {
  formData: InternetServiceFormData;
  updateFormData: (data: Partial<InternetServiceFormData>) => void;
  configs: InternetServiceConfigs;
  rackInfo?: {
    rack_id: string;
    rack_tier: string;
    rack_type?: string;
    power?: string;
    client_name?: string;
  };
}

export default function StepReview({
  formData,
  updateFormData,
  configs,
  rackInfo,
}: StepReviewProps) {
  // Calculate total fees
  const calculateTotals = () => {
    let totalMonthly = 0;
    let totalOnetime = 0;

    // Main service fee
    if (formData.service_type && formData.bandwidth) {
      const fee = configs.getServiceFee(formData.service_type, formData.bandwidth);
      totalMonthly += fee.monthly * formData.quantity;
      totalOnetime += fee.onetime * formData.quantity;
    }

    // BGP Routing
    if (formData.bgp_routing_lines > 0) {
      const fee = configs.getAddonFee("bgp_routing_lines");
      totalMonthly += fee.monthly * formData.bgp_routing_lines;
      totalOnetime += fee.onetime * formData.bgp_routing_lines;
    }

    // DNS Hosting
    if (formData.dns_hosting_domains > 0) {
      const fee = configs.getAddonFee("dns_hosting_domains");
      totalMonthly += fee.monthly * formData.dns_hosting_domains;
      totalOnetime += fee.onetime * formData.dns_hosting_domains;
    }

    // BGP/IP SEC Configuration
    if (formData.bgp_ipsec_configuration) {
      totalOnetime += configs.getAddonFee("bgp_ipsec_configuration").onetime;
    }

    // Router Maintenance
    if (formData.router_maintenance && formData.service_type) {
      totalOnetime += configs.getRouterMaintenanceFee(formData.service_type as InternetServiceType);
    }

    // Express Provisioning
    if (formData.express_provisioning) {
      totalOnetime += configs.getAddonFee("express_provisioning").onetime;
    }

    return { totalMonthly, totalOnetime };
  };

  const { totalMonthly, totalOnetime } = calculateTotals();
  const serviceTypeDef = formData.service_type
    ? configs.serviceTypeDefinitions[formData.service_type as InternetServiceType]
    : null;

  return (
    <div className="space-y-6">
      {/* Rack Selection Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Selected Rack</h3>
        </CardHeader>
        <CardBody className="px-4 py-4">
          <div className="flex items-center gap-6">
            <div className="flex-1 max-w-3xs">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rack ID</p>
              <p className="text-base">{formData.rack_id || "—"}</p>
            </div>
            {rackInfo && (
              <>
                <div className="flex-1 max-w-3xs">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tier</p>
                  <p className="text-base">{rackInfo.rack_tier || "—"}</p>
                </div>
                <div className="flex-1 max-w-3xs">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</p>
                  <p className="text-base">{rackInfo.rack_type?.replace(/_/g, " ") || "—"}</p>
                </div>
                <div className="flex-1 max-w-3xs">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Power</p>
                  <p className="text-base">{rackInfo.power?.replace(/_/g, " ") || "—"}</p>
                </div>
                <div className="flex-1 max-w-3xs">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Client</p>
                  <p className="text-base">{rackInfo.client_name || "—"}</p>
                </div>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Internet Service Summary Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Internet Service Summary</h3>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {/* Start Date */}
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subscription Start Date</p>
            <p className="text-base">{formData.start_date || "—"}</p>
          </div>

          {/* Service Details */}
          {!formData.service_type ? (
            <div className="px-4 py-6 text-center text-gray-500">
              No service selected. Please go back and select a service.
            </div>
          ) : (
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
                {formData.service_type && formData.bandwidth && (
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {serviceTypeDef?.label} ({serviceTypeDef?.description})
                      </p>
                      <p className="text-sm text-gray-500">
                        Bandwidth: {formData.bandwidth}
                      </p>
                      <p className="text-sm text-gray-500">
                        Router: {serviceTypeDef?.router}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">{formData.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      {(() => {
                        const fee = configs.getServiceFee(formData.service_type, formData.bandwidth);
                        return `SGD ${(fee.monthly * formData.quantity).toLocaleString()}`;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(() => {
                        const fee = configs.getServiceFee(formData.service_type, formData.bandwidth);
                        return `SGD ${(fee.onetime * formData.quantity).toLocaleString()}`;
                      })()}
                    </td>
                  </tr>
                )}

                {/* BGP Routing */}
                {formData.bgp_routing_lines > 0 && (
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <p className="font-medium">BGP Routing per line</p>
                    </td>
                    <td className="px-4 py-3 text-right">{formData.bgp_routing_lines}</td>
                    <td className="px-4 py-3 text-right">
                      SGD {(configs.getAddonFee("bgp_routing_lines").monthly * formData.bgp_routing_lines).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      SGD {(configs.getAddonFee("bgp_routing_lines").onetime * formData.bgp_routing_lines).toLocaleString()}
                    </td>
                  </tr>
                )}

                {/* DNS Hosting */}
                {formData.dns_hosting_domains > 0 && (
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <p className="font-medium">DNS Hosting per domain</p>
                    </td>
                    <td className="px-4 py-3 text-right">{formData.dns_hosting_domains}</td>
                    <td className="px-4 py-3 text-right">
                      SGD {(configs.getAddonFee("dns_hosting_domains").monthly * formData.dns_hosting_domains).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      SGD {(configs.getAddonFee("dns_hosting_domains").onetime * formData.dns_hosting_domains).toLocaleString()}
                    </td>
                  </tr>
                )}

                {/* BGP/IP SEC Configuration */}
                {formData.bgp_ipsec_configuration && (
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
                {formData.router_maintenance && formData.service_type && (
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <p className="font-medium">24 x 7 x 4 Annual Router Maintenance Fee</p>
                      <p className="text-sm text-gray-500">{serviceTypeDef?.router}</p>
                    </td>
                    <td className="px-4 py-3 text-right">1</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">
                      <div>SGD {configs.getRouterMaintenanceFee(formData.service_type as InternetServiceType).toLocaleString()}</div>
                      <div className="text-sm text-gray-500">(annually)</div>
                    </td>
                  </tr>
                )}

                {/* Express Provisioning */}
                {formData.express_provisioning && (
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
                  <td colSpan={2} className="px-4 py-3 text-right">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right">
                    SGD {totalMonthly.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    SGD {totalOnetime.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Remarks Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Remarks (if any)</h3>
        </CardHeader>
        <CardBody className="px-4 py-4">
          <Textarea
            placeholder="Enter any additional remarks..."
            value={formData.remark}
            onValueChange={(val) => updateFormData({ remark: val })}
            minRows={4}
          />
        </CardBody>
      </Card>
    </div>
  );
}
