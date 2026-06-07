import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Autocomplete,
  AutocompleteItem,
  RadioGroup,
  Radio,
  Spinner,
  DatePicker,
} from "@heroui/react";
import { parseDate, CalendarDate } from "@internationalized/date";
import { QuantityInput } from "atlas-shared-web/components";
import { getWithAuth } from "atlas-shared-web";
import { TimeServiceFormData, ConnectorType, TimeServiceFormItem } from "../../types/time-service";
import { TimeServiceConfigs } from "../../hooks/useTimeServiceConfigs";
import { API_BASE } from "../../lib/config";

interface FeeConfig {
  monthly_fee?: number;
  onetime_fee?: number;
}

interface RackOption {
  rack_id: string;
  rack_tier: string;
  rack_type: string;
  power?: string;
  client_id?: string;
  client_name?: string;
}

interface StepTimeServiceProps {
  formData: TimeServiceFormData;
  updateFormData: (data: Partial<TimeServiceFormData>) => void;
  configs: TimeServiceConfigs;
}

const CONNECTOR_TYPE_OPTIONS: { value: ConnectorType; label: string }[] = [
  { value: "BNC", label: "BNC" },
  { value: "TNC", label: "TNC" },
  { value: "N_TYPE", label: "N-type" },
  { value: "SMA", label: "SMA" },
];

const SERVICE_DEFINITIONS = [
  {
    type: "GPS_SIGNAL_SINGLE" as const,
    label: "GPS Signal Feed – Single",
    hasConnector: true,
    configKey: "GPS_SIGNAL_SINGLE",
  },
  {
    type: "GPS_SIGNAL_DUAL" as const,
    label: "GPS Signal Feed – Dual",
    hasConnector: true,
    configKey: "GPS_SIGNAL_DUAL",
  },
  {
    type: "PTP_SINGLE" as const,
    label: "Precision Time Protocol (PTP) Feed – Single",
    hasConnector: false,
    configKey: "PTP_SINGLE",
  },
  {
    type: "PTP_DUAL" as const,
    label: "Precision Time Protocol (PTP) Feed – Dual",
    hasConnector: false,
    configKey: "PTP_DUAL",
  },
];

export default function StepTimeService({ formData, updateFormData, configs }: StepTimeServiceProps) {

  const [racks, setRacks] = useState<RackOption[]>([]);
  const [isLoadingRacks, setIsLoadingRacks] = useState(true);
  const [rackInputValue, setRackInputValue] = useState("");

  // Fetch available racks
  useEffect(() => {
    const fetchRacks = async () => {
      setIsLoadingRacks(true);
      try {
        // Always use the main endpoint - API will filter by user's permissions
        const response = await getWithAuth(`${API_BASE}/network/racks/v1/`);
        if (response.ok) {
          const data = await response.json();
          // Show all racks (can filter by status if needed)
          setRacks(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch racks:", error);
      } finally {
        setIsLoadingRacks(false);
      }
    };

    fetchRacks();
  }, []);

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

  const handleRackChange = (rackId: string | null) => {
    updateFormData({ rack_id: rackId || "" });
    const rack = racks.find((r) => r.rack_id === rackId);
    if (rack) {
      setRackInputValue(`${rack.rack_id} - ${rack.rack_tier} (${rack.client_name || "Unassigned"})`);
    } else {
      setRackInputValue("");
    }
  };

  // Sync input value when formData.rack_id changes (e.g., on edit mode)
  useEffect(() => {
    if (formData.rack_id && racks.length > 0) {
      const rack = racks.find((r) => r.rack_id === formData.rack_id);
      if (rack) {
        setRackInputValue(`${rack.rack_id} - ${rack.rack_tier} (${rack.client_name || "Unassigned"})`);
      }
    }
  }, [formData.rack_id, racks]);

  // Get current selected service (first one in array)
  const selectedServiceType = formData.services[0]?.service_type || "";
  const selectedServiceItem = formData.services[0];
  const selectedServiceDef = SERVICE_DEFINITIONS.find(s => s.type === selectedServiceType);

  const handleServiceTypeChange = (serviceType: string) => {
    // Replace the services array with a single service of the new type
    updateFormData({
      services: [{
        service_type: serviceType as TimeServiceFormItem["service_type"],
        quantity: 1,
        connector_type: undefined,
      }],
    });
  };

  const handleQuantityChange = (quantity: number) => {
    if (selectedServiceType && quantity > 0) {
      updateFormData({
        services: [{
          ...selectedServiceItem,
          service_type: selectedServiceType as TimeServiceFormItem["service_type"],
          quantity,
        }],
      });
    }
  };

  const handleConnectorTypeChange = (connectorType: ConnectorType) => {
    if (selectedServiceType) {
      updateFormData({
        services: [{
          ...selectedServiceItem,
          service_type: selectedServiceType as TimeServiceFormItem["service_type"],
          connector_type: connectorType,
        }],
      });
    }
  };

  const selectedRack = racks.find((r) => r.rack_id === formData.rack_id);

  if (isLoadingRacks) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rack Selection Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Select Rack</h3>
        </CardHeader>
        <CardBody className="px-4 py-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select the rack to which you want to add time services.
          </p>
          <div className="max-w-md">
            <Autocomplete
              label="Rack"
              labelPlacement="outside"
              placeholder="Select a rack"
              selectedKey={formData.rack_id || null}
              onSelectionChange={(key) => handleRackChange(key as string | null)}
              inputValue={rackInputValue}
              onInputChange={setRackInputValue}
            >
              {racks.map((rack) => (
                <AutocompleteItem key={rack.rack_id} textValue={`${rack.rack_id} - ${rack.rack_tier} (${rack.client_name || "Unassigned"})`}>
                  {rack.rack_id} - {rack.rack_tier} ({rack.client_name || "Unassigned"})
                </AutocompleteItem>
              ))}
            </Autocomplete>
          </div>
          {selectedRack && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 grid grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-500">Rack ID</p>
                <p className="font-medium">{selectedRack.rack_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tier</p>
                <p className="font-medium">{selectedRack.rack_tier || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{selectedRack.rack_type?.replace(/_/g, " ") || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Power</p>
                <p className="font-medium">{selectedRack.power?.replace(/_/g, " ") || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{selectedRack.client_name || "-"}</p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Time Service Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Time Service</h3>
        </CardHeader>
        <CardBody className="px-4 py-4 space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Billing to Subscriber commences from the date indicated. Minimum subscription term is 1 year.
          </p>

          {/* Start Date */}
          <div className="max-w-xs">
            <DatePicker
              label="Subscription Start Date"
              labelPlacement="outside"
              showMonthAndYearPickers
              value={formData.start_date ? parseDate(formData.start_date) : null}
              onChange={(date: CalendarDate | null) => {
                if (date) {
                  updateFormData({ start_date: date.toString() });
                }
              }}
            />
          </div>

          {/* Service Type Selection */}
          <div>
            <p className="text-sm font-medium mb-3">Select Service Type</p>
            <RadioGroup
              value={selectedServiceType}
              onValueChange={handleServiceTypeChange}
              orientation="vertical"
              classNames={{ wrapper: "gap-4" }}
            >
              {SERVICE_DEFINITIONS.map((service) => {
                const fee = getTimeServiceFee(service.configKey);
                const spec = getSpec(service.configKey);

                return (
                  <Radio
                    key={service.type}
                    value={service.type}
                    classNames={{
                      base: "max-w-full m-0 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-transparent data-[selected=true]:border-primary items-start",
                      wrapper: "mt-1 mr-2",
                      label: "w-full",
                    }}
                  >
                    <div className="w-full">
                      <p className="font-medium">{service.label}</p>
                      {spec && <p className="text-sm text-gray-500 mt-1">{spec}</p>}
                      <p className="text-sm text-gray-500 mt-1">
                        {fee.monthly_fee !== undefined && `Monthly Fee: SGD ${fee.monthly_fee.toLocaleString()}`}
                        {fee.monthly_fee !== undefined && fee.onetime_fee !== undefined && " | "}
                        {fee.onetime_fee !== undefined && `One-time Fee: SGD ${fee.onetime_fee.toLocaleString()}`}
                      </p>
                    </div>
                  </Radio>
                );
              })}
            </RadioGroup>
          </div>

          {/* Quantity and Connector Type (shown when service is selected) */}
          {selectedServiceType && (
            <div className="space-y-4">
              {/* Quantity */}
              <div className="flex gap-6 items-end">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Quantity</p>
                  <QuantityInput
                    value={selectedServiceItem?.quantity ?? 1}
                    onChange={handleQuantityChange}
                    min={1}
                  />
                </div>
              </div>

              {/* Connector Type (for GPS services) */}
              {selectedServiceDef?.hasConnector && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Select Male Connector Type required:</p>
                  <RadioGroup
                    orientation="horizontal"
                    size="sm"
                    value={selectedServiceItem?.connector_type || ""}
                    onValueChange={(val) => handleConnectorTypeChange(val as ConnectorType)}
                  >
                    {CONNECTOR_TYPE_OPTIONS.map((option) => (
                      <Radio key={option.value} value={option.value}>
                        {option.label}
                      </Radio>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Show selected fees */}
              {selectedServiceType && (
                <div className="text-sm text-gray-500">
                  {(() => {
                    const fee = getTimeServiceFee(selectedServiceDef?.configKey || "");
                    const qty = selectedServiceItem?.quantity || 1;
                    const monthly = (fee.monthly_fee || 0) * qty;
                    const onetime = (fee.onetime_fee || 0) * qty;
                    return `Total: Monthly SGD ${monthly.toLocaleString()} | One-time SGD ${onetime.toLocaleString()}`;
                  })()}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
