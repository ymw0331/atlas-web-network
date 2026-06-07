import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Button,
  Spinner,
} from "@heroui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AlertModal, getWithAuth, postWithAuth, putWithAuth } from "atlas-shared-web";
import RackFormFields from "./rack-form-fields";
import { API_BASE } from "../../lib/config";
import { RackForm, RackCreateForm } from "../../types/rack";
import { ClientRef } from "../../types/common";

interface RackFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rackId?: string;
  onSaved?: () => void;
  clients: ClientRef[];
  allPowerTypes: Record<string, string>;
  rackPrices: Record<string, string>;
  isInternalUser?: boolean;
  userClientId?: string;
  userClientName?: string;
}

export default function RackFormDrawer({
  isOpen,
  onClose,
  rackId,
  onSaved,
  clients,
  allPowerTypes,
  rackPrices,
  isInternalUser = true,
  userClientId,
  userClientName,
}: RackFormDrawerProps) {
  const isEditMode = !!rackId;
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<RackCreateForm>({
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

  const fetchRack = useCallback(async () => {
    if (!rackId) return;
    setIsLoading(true);
    try {
      const response = await getWithAuth(`${API_BASE}/network/racks/v1/${rackId}`);
      if (response.ok) {
        const data = await response.json();
        reset({
          rack_id: data.rack_id,
          rack_tier: data.rack_tier,
          rack_type: data.rack_type,
          power: data.power,
          is_800mm_width_full_rack: data.is_800mm_width_full_rack || false,
          reserve_standard_full_rack: data.reserve_standard_full_rack,
          reserve_800mm_full_rack: data.reserve_800mm_full_rack,
          client_id: data.client_id,
          client_name: data.client_name,
        });
      }
    } catch (error) {
      console.error("Failed to fetch rack:", error);
    } finally {
      setIsLoading(false);
    }
  }, [rackId, reset]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        fetchRack();
      } else {
        // For external users, auto-populate client
        reset({
          rack_id: "",
          rack_tier: "Tier1",
          rack_type: "Full_Rack",
          power: "",
          is_800mm_width_full_rack: false,
          reserve_standard_full_rack: undefined,
          reserve_800mm_full_rack: undefined,
          client_id: !isInternalUser ? userClientId : undefined,
          client_name: !isInternalUser ? userClientName : undefined,
        });
      }
    }
  }, [isOpen, isEditMode, fetchRack, reset, isInternalUser, userClientId, userClientName]);

  const onSubmit = async (data: RackCreateForm) => {
    setIsSubmitting(true);
    try {
      const payload: RackForm | RackCreateForm = isEditMode
        ? {
            rack_tier: data.rack_tier,
            rack_type: data.rack_type,
            power: data.power,
            is_800mm_width_full_rack: data.is_800mm_width_full_rack,
            reserve_standard_full_rack: data.reserve_standard_full_rack,
            reserve_800mm_full_rack: data.reserve_800mm_full_rack,
            client_id: data.client_id,
            client_name: data.client_name,
          }
        : data;

      const response = isEditMode
        ? await putWithAuth(`${API_BASE}/network/racks/v1/${rackId}/draft`, payload)
        : await postWithAuth(`${API_BASE}/network/racks/v1/draft`, payload);

      if (response.ok) {
        onSaved?.();
        onClose();
      } else {
        const error = await response.json();
        setAlertMessage(error.detail || `Failed to ${isEditMode ? "update" : "create"} rack`);
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? "update" : "create"} rack:`, error);
      setAlertMessage(`Failed to ${isEditMode ? "update" : "create"} rack`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      placement="right"
      className="max-w-6xl"
      hideCloseButton
    >
      <DrawerContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <DrawerHeader className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
              <div>
                <h1 className="text-xl font-semibold">{isEditMode ? "Edit Rack" : "Add Rack"}</h1>
                <p className="text-sm text-gray-500">
                  {isEditMode ? `Update rack details for ${rackId}` : "Add a new rack to the system"}
                </p>
              </div>
              <Button
                isIconOnly
                variant="light"
                onPress={onClose}
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </DrawerHeader>
            <DrawerBody className="p-6">
              <form id="rack-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <RackFormFields
                  control={control}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  rackIdReadOnly={isEditMode}
                  clients={clients}
                  allPowerTypes={allPowerTypes}
                  rackPrices={rackPrices}
                  isInternalUser={isInternalUser}
                  userClientName={userClientName}
                />

                <div className="flex gap-4 pt-4">
                  <Button variant="flat" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    isLoading={isSubmitting}
                  >
                    {isEditMode ? "Update Rack" : "Create Rack"}
                  </Button>
                </div>
              </form>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
      <AlertModal
        isOpen={!!alertMessage}
        onClose={() => setAlertMessage(null)}
        title="Error"
        message={alertMessage || ""}
        buttonColor="danger"
      />
    </>
  );
}
