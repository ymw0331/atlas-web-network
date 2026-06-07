import { useState, useEffect, useRef } from "react";
import { Control, Controller, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import {
  Input,
  Autocomplete,
  AutocompleteItem,
  Switch,
  Tabs,
  Tab,
} from "@heroui/react";
import { RackCreateForm, RackTier, RackType } from "../../types/rack";
import { QuantityInput } from "atlas-shared-web/components";
import { ClientRef } from "../../types/common";

const TIER_OPTIONS: Record<RackTier, string> = {
  Tier1: "Tier 1",
  Tier2: "Tier 2",
};

const TYPE_OPTIONS: Record<RackType, string> = {
  Full_Rack: "Full Rack",
  Half_Rack: "Half Rack",
};

interface RackFormFieldsProps {
  control: Control<RackCreateForm>;
  errors: FieldErrors<RackCreateForm>;
  watch: UseFormWatch<RackCreateForm>;
  setValue: UseFormSetValue<RackCreateForm>;
  showRackId?: boolean;
  rackIdReadOnly?: boolean;
  showClientGroup?: boolean;
  clients: ClientRef[];
  allPowerTypes: Record<string, string>;
  rackPrices: Record<string, string>;
  isInternalUser?: boolean;
  userClientName?: string;
}

export default function RackFormFields({
  control,
  errors,
  watch,
  setValue,
  showRackId = true,
  rackIdReadOnly = false,
  showClientGroup = true,
  clients,
  allPowerTypes,
  rackPrices,
  isInternalUser = true,
  userClientName,
}: RackFormFieldsProps) {
  const [powerOptions, setPowerOptions] = useState<Record<string, string>>({});
  const isInitialMount = useRef(true);

  const selectedTier = watch("rack_tier");
  const selectedType = watch("rack_type");
  const selectedPower = watch("power");

  // Update power options when tier, type, or allPowerTypes changes
  useEffect(() => {
    if (!selectedTier || !selectedType || Object.keys(allPowerTypes).length === 0) {
      setPowerOptions({});
      return;
    }

    const key = `${selectedTier}@${selectedType}`;
    const filteredOptions: Record<string, string> = {};
    const powerTypesString = allPowerTypes[key];
    if (powerTypesString) {
      powerTypesString.split(",").forEach(power => {
        const label = power.replace(/_/g, " ");
        filteredOptions[power] = label;
      });
    }
    setPowerOptions(filteredOptions);

    // Adjust power: keep if exists in new options, else pick first
    const currentPower = watch("power");
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      if (!filteredOptions[currentPower]) {
        const firstPower = Object.keys(filteredOptions)[0] || "";
        setValue("power", firstPower);
      }
      // Reset add-on and reserve options when not Full Rack
      if (selectedType !== "Full_Rack") {
        setValue("is_800mm_width_full_rack", false);
        setValue("reserve_standard_full_rack", undefined);
        setValue("reserve_800mm_full_rack", undefined);
      }
    }
  }, [selectedTier, selectedType, allPowerTypes, setValue, watch]);

  const handleClientChange = (clientId: string | undefined) => {
    const client = clients.find(c => c.client_id === clientId);
    setValue("client_id", clientId);
    setValue("client_name", client?.client_name);
  };

  return (
    <div className="space-y-6">
      {showRackId && (
        <Controller
          name="rack_id"
          control={control}
          rules={{ required: !rackIdReadOnly ? "Rack ID is required" : false }}
          render={({ field }) => (
            <Input
              {...field}
              labelPlacement="outside"
              label="Rack ID"
              placeholder="Enter rack ID"
              isInvalid={!!errors.rack_id}
              errorMessage={errors.rack_id?.message}
              size="lg"
              isReadOnly={rackIdReadOnly}
            />
          )}
        />
      )}

      {showClientGroup && (
        isInternalUser ? (
          <Controller
            name="client_id"
            control={control}
            render={({ field }) => (
              <Autocomplete
                labelPlacement="outside"
                label="Client (Optional)"
                placeholder="Select client"
                selectedKey={field.value || undefined}
                onSelectionChange={(key) => handleClientChange(key as string || undefined)}
                size="lg"
              >
                {clients.map((client) => (
                  <AutocompleteItem key={client.client_id}>{client.client_name}</AutocompleteItem>
                ))}
              </Autocomplete>
            )}
          />
        ) : (
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Client</label>
            <p className="font-medium text-lg">{userClientName || "-"}</p>
          </div>
        )
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label>Rack Tier</label>
          <Controller
            name="rack_tier"
            control={control}
            rules={{ required: "Tier is required" }}
            render={({ field }) => (
              <Tabs
                color="primary"
                size="lg"
                selectedKey={field.value || undefined}
                onSelectionChange={(key) => field.onChange(key as string)}
              >
                {Object.entries(TIER_OPTIONS).map(([value, label]) => (
                  <Tab key={value} title={label} />
                ))}
              </Tabs>
            )}
          />
          {errors.rack_tier && (
            <span className="text-tiny text-danger">{errors.rack_tier.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label>Rack Type</label>
          <Controller
            name="rack_type"
            control={control}
            rules={{ required: "Type is required" }}
            render={({ field }) => (
              <Tabs
                color="primary"
                size="lg"
                selectedKey={field.value || undefined}
                onSelectionChange={(key) => field.onChange(key as string)}
              >
                {Object.entries(TYPE_OPTIONS).map(([value, label]) => (
                  <Tab key={value} title={label} />
                ))}
              </Tabs>
            )}
          />
          {errors.rack_type && (
            <span className="text-tiny text-danger">{errors.rack_type.message}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label>Power</label>
        <Controller
          name="power"
          control={control}
          rules={{ required: "Power is required" }}
          render={({ field }) => (
            <Tabs
              color="primary"
              size="lg"
              selectedKey={field.value || undefined}
              onSelectionChange={(key) => field.onChange(key as string)}
              isDisabled={!selectedTier || !selectedType}
            >
              {Object.entries(powerOptions).map(([value, label]) => (
                <Tab key={value} title={label} />
              ))}
            </Tabs>
          )}
        />
        {!selectedTier || !selectedType ? (
          <span className="text-tiny text-gray-500">Select tier and type first</span>
        ) : errors.power ? (
          <span className="text-tiny text-danger">{errors.power.message}</span>
        ) : null}
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <p className="font-medium">Rack Fee</p>
        <p className="text-sm text-gray-500">
          {(() => {
            if (!selectedTier || !selectedType || !selectedPower) return "Monthly Fee: - | One-time Fee: -";
            const monthlyKey = `MONTHLY@${selectedTier}@${selectedType}@${selectedPower}`;
            const onetimeKey = `ONETIME@${selectedTier}@${selectedType}`;
            const monthlyFee = rackPrices[monthlyKey] ? Number(rackPrices[monthlyKey]) : null;
            const onetimeFee = rackPrices[onetimeKey] ? Number(rackPrices[onetimeKey]) : null;
            const parts = [];
            parts.push(`Monthly Fee: ${monthlyFee ? `SGD ${monthlyFee.toLocaleString()}` : "-"}`);
            parts.push(`One-time Fee: ${onetimeFee ? `SGD ${onetimeFee.toLocaleString()}` : "-"}`);
            return parts.join(" | ");
          })()}
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between">
        <div>
          <Controller
            name="is_800mm_width_full_rack"
            control={control}
            render={({ field }) => (
              <Switch
                isSelected={field.value}
                onValueChange={field.onChange}
                isDisabled={selectedType !== "Full_Rack"}
                size="lg"
              >
                Add on: Upgrade Standard Full Rack to 800mm Width
              </Switch>
            )}
          />
          <p className="text-sm text-gray-500 mt-1">
            {(() => {
              if (!selectedTier || !selectedType) return "Monthly Fee: - | One-time Fee: -";
              const monthlyKey = `MONTHLY@${selectedTier}@${selectedType}@is_800mm_width_full_rack`;
              const onetimeKey = `ONETIME@${selectedTier}@${selectedType}@is_800mm_width_full_rack`;
              const monthlyFee = rackPrices[monthlyKey] ? Number(rackPrices[monthlyKey]) : null;
              const onetimeFee = rackPrices[onetimeKey] ? Number(rackPrices[onetimeKey]) : null;
              const parts = [];
              parts.push(`Monthly Fee: ${monthlyFee ? `SGD ${monthlyFee.toLocaleString()}` : "-"}`);
              parts.push(`One-time Fee: ${onetimeFee ? `SGD ${onetimeFee.toLocaleString()}` : "-"}`);
              return parts.join(" | ");
            })()}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className={`font-medium ${selectedType !== "Full_Rack" ? "text-gray-400" : ""}`}>Reserve Standard Full Rack next to existing Subscriber Rack</p>
            <p className="text-sm text-gray-500">
              Monthly Fee: {rackPrices["MONTHLY@reserve_standard_full_rack"] ? `SGD ${Number(rackPrices["MONTHLY@reserve_standard_full_rack"]).toLocaleString()}` : "-"}
            </p>
          </div>
          <Controller
            name="reserve_standard_full_rack"
            control={control}
            render={({ field }) => (
              <QuantityInput
                value={field.value ?? 0}
                onChange={(val) => field.onChange(val || undefined)}
                disabled={selectedType !== "Full_Rack"}
              />
            )}
          />
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className={`font-medium ${selectedType !== "Full_Rack" ? "text-gray-400" : ""}`}>Reserve 800mm Full Rack next to existing Subscriber Rack</p>
            <p className="text-sm text-gray-500">
              Monthly Fee: {rackPrices["MONTHLY@reserve_800mm_full_rack"] ? `SGD ${Number(rackPrices["MONTHLY@reserve_800mm_full_rack"]).toLocaleString()}` : "-"}
            </p>
          </div>
          <Controller
            name="reserve_800mm_full_rack"
            control={control}
            render={({ field }) => (
              <QuantityInput
                value={field.value ?? 0}
                onChange={(val) => field.onChange(val || undefined)}
                disabled={selectedType !== "Full_Rack"}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
