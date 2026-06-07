import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Autocomplete,
  AutocompleteItem,
  RadioGroup,
  Radio,
  Select,
  SelectItem,
  Checkbox,
  Spinner,
  DatePicker,
} from "@heroui/react";
import { parseDate, CalendarDate } from "@internationalized/date";
import { QuantityInput } from "atlas-shared-web/components";
import {
  InternetServiceFormData,
  InternetServiceType,
} from "../../types/internet-service";
import { InternetServiceConfigs } from "../../hooks/useInternetServiceConfigs";
import { useRacks } from "../../hooks/useRacks";

interface StepInternetServiceProps {
  formData: InternetServiceFormData;
  updateFormData: (data: Partial<InternetServiceFormData>) => void;
  configs: InternetServiceConfigs;
}

export default function StepInternetService({
  formData,
  updateFormData,
  configs,
}: StepInternetServiceProps) {
  const { racks, isLoading: isLoadingRacks } = useRacks();
  const [rackInputValue, setRackInputValue] = useState("");

  const handleRackChange = (rackId: string | null) => {
    updateFormData({ rack_id: rackId || "" });
    const rack = racks.find((r) => r.rack_id === rackId);
    if (rack) {
      setRackInputValue(`${rack.rack_id} - ${rack.rack_tier} (${rack.client_name || "Unassigned"})`);
    } else {
      setRackInputValue("");
    }
  };

  // Sync input value when formData.rack_id changes
  useEffect(() => {
    if (formData.rack_id && racks.length > 0) {
      const rack = racks.find((r) => r.rack_id === formData.rack_id);
      if (rack) {
        setRackInputValue(`${rack.rack_id} - ${rack.rack_tier} (${rack.client_name || "Unassigned"})`);
      }
    }
  }, [formData.rack_id, racks]);

  // Handle service type change - reset bandwidth when type changes
  const handleServiceTypeChange = (serviceType: string) => {
    updateFormData({
      service_type: serviceType as InternetServiceType,
      bandwidth: "", // Reset bandwidth when service type changes
    });
  };

  const selectedRack = racks.find((r) => r.rack_id === formData.rack_id);
  const availableBandwidths = formData.service_type
    ? configs.getBandwidthsForServiceType(formData.service_type as InternetServiceType)
    : [];

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
            Select the rack to which you want to add internet service.
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
                <AutocompleteItem
                  key={rack.rack_id}
                  textValue={`${rack.rack_id} - ${rack.rack_tier} (${rack.client_name || "Unassigned"})`}
                >
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

      {/* Internet Service Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Internet Service</h3>
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
              value={formData.service_type}
              onValueChange={handleServiceTypeChange}
              orientation="vertical"
              classNames={{ wrapper: "gap-4" }}
            >
              {(Object.keys(configs.serviceTypeDefinitions) as InternetServiceType[]).map((type) => {
                const def = configs.serviceTypeDefinitions[type];

                return (
                  <Radio
                    key={type}
                    value={type}
                    classNames={{
                      base: "max-w-full m-0 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-transparent data-[selected=true]:border-primary items-start",
                      wrapper: "mt-1 mr-2",
                      label: "w-full",
                    }}
                  >
                    <div className="w-full">
                      <p className="font-medium">{def.label} ({def.description})</p>
                      <ul className="text-sm text-gray-500 mt-2 space-y-1 list-disc list-inside">
                        {def.details.map((detail, idx) => (
                          <li key={idx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  </Radio>
                );
              })}
            </RadioGroup>
          </div>

          {/* Bandwidth Selection */}
          {formData.service_type && (
            <div className="flex gap-6 items-end">
              <div className="flex-1 max-w-xs">
                <Select
                  label="Bandwidth"
                  labelPlacement="outside"
                  placeholder="Select bandwidth"
                  selectedKeys={formData.bandwidth ? [formData.bandwidth] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    updateFormData({ bandwidth: selected || "" });
                  }}
                >
                  {availableBandwidths.map((bw) => {
                    const fee = configs.getServiceFee(formData.service_type, bw);
                    return (
                      <SelectItem key={bw} textValue={bw}>
                        <div className="flex justify-between w-full">
                          <span>{bw}</span>
                          <span className="text-gray-500">SGD {fee.monthly.toLocaleString()}/mo</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </Select>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Quantity</p>
                <QuantityInput
                  value={formData.quantity}
                  onChange={(val) => updateFormData({ quantity: val })}
                  min={1}
                />
              </div>
            </div>
          )}

          {/* Show selected bandwidth fees */}
          {formData.service_type && formData.bandwidth && (
            <div className="text-sm text-gray-500">
              {(() => {
                const fee = configs.getServiceFee(formData.service_type, formData.bandwidth);
                return `Monthly: SGD ${fee.monthly.toLocaleString()} | One-time: SGD ${fee.onetime.toLocaleString()}`;
              })()}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add-on Services Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Add-on Services</h3>
        </CardHeader>
        <CardBody className="px-4 py-4 space-y-4">
          {/* BGP Routing */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex-1">
              <p className="font-medium">BGP Routing per line</p>
              <p className="text-sm text-gray-500">
                Monthly: SGD {configs.getAddonFee("bgp_routing_lines").monthly.toLocaleString()} | One-time: SGD {configs.getAddonFee("bgp_routing_lines").onetime.toLocaleString()} per line
              </p>
            </div>
            <QuantityInput
              value={formData.bgp_routing_lines}
              onChange={(val) => updateFormData({ bgp_routing_lines: val })}
            />
          </div>

          {/* DNS Hosting */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex-1">
              <p className="font-medium">DNS Hosting per domain</p>
              <p className="text-sm text-gray-500">
                Monthly: SGD {configs.getAddonFee("dns_hosting_domains").monthly.toLocaleString()} | One-time: SGD {configs.getAddonFee("dns_hosting_domains").onetime.toLocaleString()} per domain
              </p>
            </div>
            <QuantityInput
              value={formData.dns_hosting_domains}
              onChange={(val) => updateFormData({ dns_hosting_domains: val })}
            />
          </div>

          {/* BGP/IP SEC Configuration */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <Checkbox
              isSelected={formData.bgp_ipsec_configuration}
              onValueChange={(val) => updateFormData({ bgp_ipsec_configuration: val })}
            >
              <div>
                <p className="font-medium">BGP Routing or IP SEC configuration</p>
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  <li>Configuration during office hours. (subject to confirmation after discussion on scope of work)</li>
                  <li>1 hour of remote hand charges (estimated SGD 400) apply for after office-hours configuration.</li>
                </ul>
                <p className="text-sm text-gray-500">One-time: SGD {configs.getAddonFee("bgp_ipsec_configuration").onetime.toLocaleString()}</p>
              </div>
            </Checkbox>
          </div>

          {/* Router Maintenance */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <Checkbox
              isSelected={formData.router_maintenance}
              onValueChange={(val) => updateFormData({ router_maintenance: val })}
              isDisabled={!formData.service_type}
            >
              <div>
                <p className={`font-medium ${!formData.service_type ? "text-gray-400" : ""}`}>
                  24 x 7 x 4 Annual Router Maintenance Fee
                </p>
                <p className={`text-sm ${!formData.service_type ? "text-gray-400" : "text-gray-500"}`}>
                  {formData.service_type && configs.serviceTypeDefinitions[formData.service_type as InternetServiceType] &&
                    `${configs.serviceTypeDefinitions[formData.service_type as InternetServiceType].label} (${configs.serviceTypeDefinitions[formData.service_type as InternetServiceType].description}) | Annual: SGD ${configs.getRouterMaintenanceFee(formData.service_type as InternetServiceType).toLocaleString()}`}
                  {!formData.service_type && "Select a service type first"}
                </p>
              </div>
            </Checkbox>
          </div>

          {/* Express Provisioning */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <Checkbox
              isSelected={formData.express_provisioning}
              onValueChange={(val) => updateFormData({ express_provisioning: val })}
            >
              <div>
                <p className="font-medium">Express Provisioning</p>
                <p className="text-sm text-gray-500">One-time: SGD {configs.getAddonFee("express_provisioning").onetime.toLocaleString()}</p>
              </div>
            </Checkbox>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
