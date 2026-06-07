import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  RadioGroup,
  Radio,
  DatePicker,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Autocomplete,
  AutocompleteItem,
  useDisclosure,
  Card,
  CardHeader,
  CardBody,
} from "@heroui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { parseDate, CalendarDate } from "@internationalized/date";
import { ColoFormData } from "../../types/co-location";
import { RackForm, RackCreateForm } from "../../types/rack";
import { QuantityInput } from "atlas-shared-web/components";
import { useAuth } from "atlas-shared-web";
import { ColocationConfigs } from "../../hooks/useColocationConfigs";
import RackFormFields from "../racks/rack-form-fields";

interface FeeConfig {
  monthly_fee?: number;
  onetime_fee?: number;
}

interface StepRacksProps {
  formData: ColoFormData;
  updateFormData: (data: Partial<ColoFormData>) => void;
  configs: ColocationConfigs;
}

export default function StepRacks({ formData, updateFormData, configs }: StepRacksProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();

  const isInternalUser = user?.internal ?? false;

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<RackCreateForm>({
    defaultValues: {
      rack_id: "",
      rack_tier: "Tier1",
      rack_type: "Full_Rack",
      power: "",
      is_800mm_width_full_rack: false,
      reserve_standard_full_rack: undefined,
      reserve_800mm_full_rack: undefined,
      client_id: undefined,
      client_name: undefined,
    },
  });

  // Auto-populate client for non-internal users
  const userClientId = user?.client_id;
  const userClientName = user?.client_name;

  useEffect(() => {
    if (!isInternalUser && userClientId && !formData.client_id) {
      updateFormData({
        client_id: userClientId,
        client_name: userClientName,
      });
    }
  }, [isInternalUser, userClientId, userClientName, formData.client_id, updateFormData]);

  const handleClientChange = (clientId?: string) => {
    const client = configs.clients.find(c => c.client_id === clientId);
    updateFormData({
      client_id: clientId,
      client_name: client?.client_name,
    });
  };

  // Get fee for a colocation field from CO_LOCATION PRICES
  const getColocationFee = (fieldName: string): FeeConfig => {
    const monthlyKey = `MONTHLY@${fieldName}`;
    const onetimeKey = `ONETIME@${fieldName}`;
    return {
      monthly_fee: configs.prices[monthlyKey] ? Number(configs.prices[monthlyKey]) : undefined,
      onetime_fee: configs.prices[onetimeKey] ? Number(configs.prices[onetimeKey]) : undefined,
    };
  };

  // Render fee display
  const renderFee = (fee: FeeConfig): React.ReactNode => {
    if (!fee.monthly_fee && !fee.onetime_fee) return null;
    return (
      <p className="text-sm text-gray-500">
        {fee.monthly_fee && <span>Monthly Fee: SGD {fee.monthly_fee.toLocaleString()}</span>}
        {fee.monthly_fee && fee.onetime_fee && " | "}
        {fee.onetime_fee && <span>One-time Fee: SGD {fee.onetime_fee.toLocaleString()}</span>}
      </p>
    );
  };

  const handleOpenModal = () => {
    reset({
      rack_id: "",
      rack_tier: "Tier1",
      rack_type: "Full_Rack",
      power: "",
      is_800mm_width_full_rack: false,
      reserve_standard_full_rack: undefined,
      reserve_800mm_full_rack: undefined,
      client_id: undefined,
      client_name: undefined,
    });
    onOpen();
  };

  const onSubmitRack = (data: RackCreateForm) => {
    const newRack: RackForm = {
      rack_tier: data.rack_tier,
      rack_type: data.rack_type,
      power: data.power,
      is_800mm_width_full_rack: data.is_800mm_width_full_rack,
      reserve_standard_full_rack: data.reserve_standard_full_rack,
      reserve_800mm_full_rack: data.reserve_800mm_full_rack,
    };

    updateFormData({
      rackSpecs: {
        ...formData.rackSpecs,
        racks: [...formData.rackSpecs.racks, newRack],
      },
    });

    onClose();
  };

  const removeRackItem = (index: number) => {
    updateFormData({
      rackSpecs: {
        ...formData.rackSpecs,
        racks: formData.rackSpecs.racks.filter((_, i) => i !== index),
      },
    });
  };

  // Helper to convert power_strips_by_atlas to radio value
  const getPowerStripsValue = () => {
    const value = formData.rackSpecs.power_strips_by_atlas;
    if (value === null || value === undefined) return "";
    return value ? "yes" : "no";
  };

  const handlePowerStripsChange = (value: string) => {
    updateFormData({
      rackSpecs: {
        ...formData.rackSpecs,
        power_strips_by_atlas: value === "yes",
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Subscription Start Date Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Subscription Start Date and Term</h3>
        </CardHeader>
        <CardBody className="px-4 py-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Billing commences from the date indicated on a 12-month term.
          </p>
          <div className="max-w-sm">
            {isInternalUser ? (
              <Autocomplete
                label="Client"
                labelPlacement="outside"
                placeholder="Select client"
                selectedKey={formData.client_id || null}
                onSelectionChange={(key) => handleClientChange(key as string || undefined)}
              >
                {configs.clients.map((client) => (
                  <AutocompleteItem key={client.client_id}>{client.client_name}</AutocompleteItem>
                ))}
              </Autocomplete>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-1">Client</p>
                <p className="font-medium">{formData.client_name || userClientName || "-"}</p>
              </div>
            )}
          </div>
          <div className="max-w-sm">
            <DatePicker
              label="Rack Subscription Start Date"
              labelPlacement="outside"
              showMonthAndYearPickers
              value={formData.startDate ? parseDate(formData.startDate) : null}
              onChange={(date: CalendarDate | null) => {
                if (date) {
                  updateFormData({ startDate: date.toString() });
                }
              }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Rack Specification Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Rack Specification</h3>
        </CardHeader>
        <CardBody className="px-4 py-4 space-y-6">
          {/* Rack Dimensions */}
          <div>
            <h4 className="text-base font-semibold mb-3">Rack Specification</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>{configs.rackSpecs["Full_Rack"]}</li>
              <li>{configs.rackSpecs["Half_Rack"]}</li>
            </ul>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Power Strips Details */}
          <div>
            <h4 className="text-base font-semibold mb-3">Power Strips Details</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Default 2 x standard unmanaged type power strips per rack to be provided by ATLAS?
            </p>
            <RadioGroup
              value={getPowerStripsValue()}
              onValueChange={handlePowerStripsChange}
            >
              <Radio value="yes">
                Yes, ATLAS will provide Default 2 x standard unmanaged type power strips per rack
              </Radio>
              <Radio value="no">
                No, we will provide the power strips
              </Radio>
            </RadioGroup>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Rack Table */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-base font-semibold">Racks</h4>
              <Button
                color="primary"
                size="sm"
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={handleOpenModal}
              >
                Add Rack
              </Button>
            </div>
            {formData.rackSpecs.racks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No racks added yet. Click &apos;Add Rack&apos; to add.</p>
            ) : (
              <div className="space-y-3">
                {formData.rackSpecs.racks.map((rack, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-4 gap-4">
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
                    <Button
                      isIconOnly
                      size="md"
                      variant="flat"
                      color="danger"
                      className="ml-4"
                      onPress={() => removeRackItem(index)}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Utilisation by Subscriber Customers */}
          <div>
            <h4 className="text-base font-semibold mb-3">Utilisation by Subscriber Customers</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please indicate the number of Racks utilised by the Subscriber Customers declared below.
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Subscriber Racks utilised by Subscriber Customers</p>
                {renderFee(getColocationFee("subscriber_customers"))}
              </div>
              <QuantityInput
                value={formData.rackSpecs.subscriber_customers ?? 0}
                onChange={(val) => updateFormData({
                  rackSpecs: {
                    ...formData.rackSpecs,
                    subscriber_customers: val || undefined,
                  },
                })}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Add Rack Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmitRack)}>
            <ModalHeader>Add Rack</ModalHeader>
            <ModalBody>
              <RackFormFields
                control={control}
                errors={errors}
                watch={watch}
                setValue={setValue}
                showRackId={false}
                showClientGroup={false}
                clients={configs.clients}
                allPowerTypes={configs.allPowerTypes}
                rackPrices={configs.rackPrices}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
              >
                Add
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
