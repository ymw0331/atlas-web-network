import { Textarea, Card, CardHeader, CardBody } from "@heroui/react";
import { TimeServiceFormData } from "../../types/time-service";
import { TimeServiceConfigs } from "../../hooks/useTimeServiceConfigs";

interface StepReviewProps {
  formData: TimeServiceFormData;
  updateFormData: (data: Partial<TimeServiceFormData>) => void;
  configs: TimeServiceConfigs;
  rackInfo?: { rack_id: string; rack_tier: string; rack_type?: string; power?: string; client_name?: string };
}

interface FeeConfig {
  monthly_fee?: number;
  onetime_fee?: number;
}

const SERVICE_CONFIG: Record<string, { label: string; configKey: string }> = {
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

export default function StepReview({
  formData,
  updateFormData,
  configs,
  rackInfo,
}: StepReviewProps) {
  // Get fee for a time service field from PRICES config
  const getTimeServiceFee = (configKey: string): FeeConfig => {
    const monthlyKey = `MONTHLY@${configKey}`;
    const onetimeKey = `ONETIME@${configKey}`;
    return {
      monthly_fee: configs.prices[monthlyKey] ? Number(configs.prices[monthlyKey]) : undefined,
      onetime_fee: configs.prices[onetimeKey] ? Number(configs.prices[onetimeKey]) : undefined,
    };
  };

  // Get spec/description for a field from SPECS config
  const getSpec = (configKey: string): string => {
    return configs.specs[configKey] || "";
  };

  // Calculate total fees
  const calculateTotals = () => {
    let totalMonthly = 0;
    let totalOnetime = 0;

    formData.services.forEach((service) => {
      const serviceInfo = SERVICE_CONFIG[service.service_type];
      if (serviceInfo) {
        const fee = getTimeServiceFee(serviceInfo.configKey);
        totalMonthly += (fee.monthly_fee || 0) * service.quantity;
        totalOnetime += (fee.onetime_fee || 0) * service.quantity;
      }
    });

    return { totalMonthly, totalOnetime };
  };

  const { totalMonthly, totalOnetime } = calculateTotals();

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

      {/* Time Services Summary Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Time Services Summary</h3>
        </CardHeader>
        <CardBody className="px-0 py-0">
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subscription Start Date</p>
            <p className="text-base">{formData.start_date || "—"}</p>
          </div>
          {formData.services.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500">
              No services selected. Please go back and add at least one service.
            </div>
          ) : (
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
                {formData.services.map((service, index) => {
                  const serviceInfo = SERVICE_CONFIG[service.service_type];
                  const fee = serviceInfo ? getTimeServiceFee(serviceInfo.configKey) : { monthly_fee: 0, onetime_fee: 0 };
                  const spec = serviceInfo ? getSpec(serviceInfo.configKey) : "";
                  const monthlyTotal = (fee.monthly_fee || 0) * service.quantity;
                  const onetimeTotal = (fee.onetime_fee || 0) * service.quantity;

                  return (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{serviceInfo?.label || service.service_type}</p>
                        {spec && <p className="text-sm text-gray-500">{spec}</p>}
                        {service.connector_type && (
                          <p className="text-sm text-gray-500">
                            Connector: {CONNECTOR_LABELS[service.connector_type] || service.connector_type}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{service.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        SGD {monthlyTotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        SGD {onetimeTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
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
