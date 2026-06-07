import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Autocomplete,
  AutocompleteItem,
  Checkbox,
  Textarea,
  Switch,
  Spinner,
} from "@heroui/react";
import { useAuth, getWithAuth } from "atlas-shared-web";
import { API_BASE } from "../../lib/config";
import { Rack } from "../../types/rack";
import { CrossConnectRequestForm, CrossConnectApiPayload } from "../../types/cross-connect";
import { useCrossConnectConfigs } from "../../hooks/useCrossConnectConfigs";

interface CrossConnectFormProps {
  mode: "create" | "edit";
  crossConnectId?: string;
  initialData?: Partial<CrossConnectRequestForm>;
  onSubmit: (payload: CrossConnectApiPayload) => Promise<void>;
  onSaveDraft?: (payload: CrossConnectApiPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  isSavingDraft?: boolean;
}

export default function CrossConnectForm({
  mode,
  crossConnectId,
  initialData,
  onSubmit,
  onSaveDraft,
  onCancel,
  isSubmitting = false,
  isSavingDraft = false,
}: CrossConnectFormProps) {
  const { user } = useAuth();
  const isInternalUser = user?.internal ?? false;
  const { prices, isLoading: isConfigLoading } = useCrossConnectConfigs();
  const [racks, setRacks] = useState<Rack[]>([]);
  const [targetOwnRack, setTargetOwnRack] = useState(false);

  // Get prices from config with fallback values
  const monthlyCost = prices["single_mode_fiber_monthly"] || "350";
  const oneTimeCost = prices["single_mode_fiber_one_time"] || "600";
  const expressProvisioningCost = prices["express_provisioning"] || "600";

  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CrossConnectRequestForm>({
    defaultValues: {
      source_rack_id: "",
      source_client_id: "",
      source_client_name: "",
      target_rack_id: "",
      target_client_id: "",
      target_client_name: "",
      express_provisioning: false,
      remark: "",
      ...initialData,
    },
  });

  useEffect(() => {
    fetchRacks();
  }, []);

  useEffect(() => {
    if (initialData) {
      reset({
        source_rack_id: "",
        source_client_id: "",
        source_client_name: "",
        target_rack_id: "",
        target_client_id: "",
        target_client_name: "",
        express_provisioning: false,
        remark: "",
        ...initialData,
      });
    }
  }, [initialData, reset]);

  // For external users in edit mode, determine if target rack is in racks list
  const currentTargetRackId = watch("target_rack_id");
  useEffect(() => {
    if (!isInternalUser && racks.length > 0 && currentTargetRackId) {
      const isOwnRack = racks.some(r => r.rack_id === currentTargetRackId);
      setTargetOwnRack(isOwnRack);
    }
  }, [isInternalUser, racks, currentTargetRackId]);

  const fetchRacks = async () => {
    try {
      const response = await getWithAuth(`${API_BASE}/network/racks/v1/`);
      if (response.ok) {
        const data = await response.json();
        setRacks(data);
      }
    } catch (error) {
      console.error("Failed to fetch racks:", error);
    }
  };

  const handleSourceRackChange = (rackId: string) => {
    setValue("source_rack_id", rackId);
    const rack = racks.find(r => r.rack_id === rackId);
    setValue("source_client_id", rack?.client_id || "");
    setValue("source_client_name", rack?.client_name || "");
  };

  const handleTargetRackChange = (rackId: string) => {
    setValue("target_rack_id", rackId);
    const rack = racks.find(r => r.rack_id === rackId);
    setValue("target_client_id", rack?.client_id || "");
    setValue("target_client_name", rack?.client_name || "");
  };

  const buildApiPayload = (data: CrossConnectRequestForm): CrossConnectApiPayload => ({
    source_rack_id: data.source_rack_id,
    source_client_id: data.source_client_id || undefined,
    source_client_name: data.source_client_name || undefined,
    target_rack_id: data.target_rack_id,
    target_client_id: data.target_client_id || undefined,
    target_client_name: data.target_client_name || undefined,
    remark: data.remark || undefined,
    express_provisioning: data.express_provisioning || undefined,
  });

  const buildDraftApiPayload = (data: CrossConnectRequestForm): CrossConnectApiPayload => ({
    source_rack_id: data.source_rack_id,
    target_rack_id: data.target_rack_id,
    remark: data.remark || undefined,
    express_provisioning: data.express_provisioning || undefined,
  });

  const handleFormSubmit = async (data: CrossConnectRequestForm) => {
    await onSubmit(buildApiPayload(data));
  };

  const handleSaveDraft = async (data: CrossConnectRequestForm) => {
    if (onSaveDraft) {
      await onSaveDraft(buildDraftApiPayload(data));
    }
  };

  if (isConfigLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold">
          {mode === "create" ? "Cross-Connection Request" : "Edit Cross-Connect"}
        </h1>
        <p className="text-gray-500 text-sm">
          {mode === "create"
            ? "Application Form for Network between Two Racks"
            : "Update cross-connect details"
          }
        </p>
      </div>

      {/* Intro Section - only for create mode */}
      {mode === "create" && (
        <div className="mb-6">
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <p>
              The Subscriber hereby applies for the Services to be provided by ATLAS. Incomplete forms will result in processing delays. ATLAS may reject any application, in whole or in part, without providing an explanation to the Subscriber.
            </p>
            <p>
              All Fees in this Application Form are in Singapore dollars, excluding prevailing GST, unless otherwise stated or the context otherwise requires.
            </p>
            <p>
              All cross-connections to Network Service Providers (NSP) need to be ordered by the NSP. Please contact your NSP to place the order for the cross-connection if this is your intention for the cross-connection.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Cross-Connect ID - only for edit mode */}
        {mode === "edit" && crossConnectId && (
          <Card>
            <CardBody className="p-6">
              <Input
                value={crossConnectId}
                labelPlacement="outside"
                label="Cross-Connect ID"
                isReadOnly
              />
            </CardBody>
          </Card>
        )}

        {/* Cross-Connection Details */}
        <Card>
          <CardHeader className="bg-gray-100 dark:bg-gray-800 px-6 py-4">
            <h2 className="text-base font-semibold">Cross-Connection Details</h2>
          </CardHeader>
          <CardBody className="space-y-6 p-6">
            <Controller
              name="source_rack_id"
              control={control}
              rules={{ required: "Source Rack ID is required" }}
              render={({ field }) => (
                <Autocomplete
                  label="Source Rack ID"
                  labelPlacement="outside"
                  placeholder="Rack ID"
                  selectedKey={field.value}
                  onSelectionChange={(key) => handleSourceRackChange(key as string || "")}
                  isInvalid={!!errors.source_rack_id}
                  errorMessage={errors.source_rack_id?.message}
                >
                  {racks.map((rack) => (
                    <AutocompleteItem key={rack.rack_id}>{rack.rack_id}</AutocompleteItem>
                  ))}
                </Autocomplete>
              )}
            />

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Source Client</p>
              <p className="text-base font-medium">{watch("source_client_name") || "-"}</p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 pt-6 space-y-6">
              {/* Show switch only for external users */}
              {!isInternalUser && (
                <Switch
                  isSelected={targetOwnRack}
                  onValueChange={(value) => {
                    setTargetOwnRack(value);
                    setValue("target_rack_id", "");
                    setValue("target_client_id", "");
                    setValue("target_client_name", "");
                  }}
                >
                  Target for own rack
                </Switch>
              )}

              {/* Internal users always see dropdown, external users see dropdown only when targetOwnRack is true */}
              {(isInternalUser || targetOwnRack) ? (
                <>
                  <Controller
                    name="target_rack_id"
                    control={control}
                    rules={{ required: "Target Rack ID is required" }}
                    render={({ field }) => (
                      <Autocomplete
                        label="Target Rack ID"
                        labelPlacement="outside"
                        placeholder="Select target rack"
                        selectedKey={field.value}
                        onSelectionChange={(key) => handleTargetRackChange(key as string || "")}
                        isInvalid={!!errors.target_rack_id}
                        errorMessage={errors.target_rack_id?.message}
                      >
                        {racks.map((rack) => (
                          <AutocompleteItem key={rack.rack_id}>{rack.rack_id}</AutocompleteItem>
                        ))}
                      </Autocomplete>
                    )}
                  />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Target Client</p>
                    <p className="text-base font-medium">{watch("target_client_name") || "-"}</p>
                  </div>
                </>
              ) : (
                <Controller
                  name="target_rack_id"
                  control={control}
                  rules={{ required: "Target Rack ID is required" }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Target Rack ID"
                      labelPlacement="outside"
                      placeholder="Rack ID - Free Text"
                      isInvalid={!!errors.target_rack_id}
                      errorMessage={errors.target_rack_id?.message}
                    />
                  )}
                />
              )}
            </div>
          </CardBody>
        </Card>

        {/* Cross-connection Cable & Charges */}
        <Card>
          <CardHeader className="bg-gray-100 dark:bg-gray-800 px-6 py-4">
            <h2 className="text-base font-semibold">Cross-connection Cable & Charges</h2>
          </CardHeader>
          <CardBody className="p-6">
            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-medium">All requests will be connected through Single-mode Fiber</p>
                  <p className="text-gray-500 dark:text-gray-400">Monthly charges will not be applicable if cross-connecting between 2 contiguous racks belonging to the same subscriber</p>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="flex items-center justify-center gap-8 text-sm">
              <span className="font-medium">Single-mode Fiber</span>
              <span>Monthly Cost: <span className="font-semibold">SGD {monthlyCost}</span></span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>One-time Cost: <span className="font-semibold">SGD {oneTimeCost}</span></span>
            </div>
          </CardBody>
        </Card>

        {/* Express Provisioning */}
        <Card>
          <CardHeader className="bg-gray-100 dark:bg-gray-800 px-6 py-4">
            <h2 className="text-base font-semibold">Express Provisioning</h2>
          </CardHeader>
          <CardBody className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select this if you are submitting this with less than 2.5 working days to the weekend and you would like the above cross-connection to be completed by the weekend. This is subject to resource availability and you would not be billed for the additional one-time cost for it if this cannot be done.
            </p>
            <Controller
              name="express_provisioning"
              control={control}
              render={({ field }) => (
                <Checkbox
                  isSelected={field.value}
                  onValueChange={field.onChange}
                >
                  <div>
                    <span className="font-medium">Express Provisioning</span>
                    <p className="text-sm text-gray-500">Additional one-time cost SGD {expressProvisioningCost}</p>
                  </div>
                </Checkbox>
              )}
            />
          </CardBody>
        </Card>

        {/* Reason Section */}
        <Card>
          <CardHeader className="bg-gray-100 dark:bg-gray-800 px-6 py-4">
            <h2 className="text-base font-semibold">Reason for cross-connection between different participants and/or rack subscription tiers</h2>
          </CardHeader>
          <CardBody className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              If the above cross-connection(s) are between different participants or different rack subscription tiers, ATLAS reserves the right to not fulfill the cross-connection without providing any reasons. If so, please state the reason(s) for the purpose of the cross-connection:
            </p>
            <Controller
              name="remark"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder=""
                  minRows={4}
                  classNames={{
                    input: "bg-white dark:bg-gray-900",
                  }}
                />
              )}
            />
          </CardBody>
        </Card>

        {/* Subscription Term - only for create mode */}
        {mode === "create" && (
          <Card>
            <CardHeader className="bg-gray-100 dark:bg-gray-800 px-6 py-4">
              <h2 className="text-base font-semibold">Subscription Term</h2>
            </CardHeader>
            <CardBody className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                There is no minimum subscription term for cross-connections and this can be terminated with a minimum of one month&apos;s notice by writing to{" "}
                <a href="mailto:it_helpdesk@atlas.com" className="text-blue-600 hover:underline">it_helpdesk@atlas.com</a>.
                The notice for termination is only considered received once a Request ticket is issued. Charges are on a monthly basis and would not be pro-rated.
              </p>
            </CardBody>
          </Card>
        )}
      </form>

      {/* Footer Actions */}
      <div className="flex justify-between items-center mt-6">
        <Button
          variant="light"
          color="primary"
          onPress={onCancel}
        >
          Cancel
        </Button>
        <div className="flex gap-3">
          {onSaveDraft && (
            <Button
              variant="bordered"
              isLoading={isSavingDraft}
              onPress={() => handleSubmit(handleSaveDraft)()}
            >
              Save as draft
            </Button>
          )}
          <Button
            color="primary"
            isLoading={isSubmitting}
            onPress={() => handleSubmit(handleFormSubmit)()}
          >
            {mode === "create" ? "Submit" : "Update Cross-Connect"}
          </Button>
        </div>
      </div>
    </>
  );
}
