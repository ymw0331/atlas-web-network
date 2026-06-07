import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
} from "@heroui/react";
import { AlertModal } from "atlas-shared-web/components";
import { useAuth, getWithAuth, putWithAuth } from "atlas-shared-web";
import RackFormFields from "../../components/racks/rack-form-fields";
import { API_BASE } from "../../lib/config";
import { RackForm, RackCreateForm } from "../../types/rack";
import { useRackConfigs } from "../../hooks/useRackConfigs";

export default function EditRack() {
  const router = useRouter();
  const { user } = useAuth();
  const isInternalUser = user?.internal ?? false;
  const configs = useRackConfigs(isInternalUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const id = router.query.id as string;

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
    try {
      const response = await getWithAuth(`${API_BASE}/network/racks/v1/${id}`);
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
      } else {
        setAlertMessage("Rack not found.");
        setShouldRedirect(true);
      }
    } catch (error) {
      console.error("Failed to fetch rack:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, reset, router]);

  useEffect(() => {
    if (!router.isReady) return;

    if (!id) {
      router.push("/racks");
      return;
    }

    fetchRack();
  }, [router.isReady, id, router, fetchRack]);

  const onSubmit = async (data: RackCreateForm) => {
    setIsSubmitting(true);
    try {
      const payload: RackForm = {
        rack_tier: data.rack_tier,
        rack_type: data.rack_type,
        power: data.power,
        is_800mm_width_full_rack: data.is_800mm_width_full_rack,
        reserve_standard_full_rack: data.reserve_standard_full_rack,
        reserve_800mm_full_rack: data.reserve_800mm_full_rack,
        client_id: data.client_id,
        client_name: data.client_name,
      };

      const response = await putWithAuth(`${API_BASE}/network/racks/v1/${id}/draft`, payload);
      if (response.ok) {
        router.push("/racks");
      } else {
        const error = await response.json();
        setAlertMessage(error.detail || "Failed to update rack. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update rack:", error);
      setAlertMessage("Failed to update rack. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader className="flex flex-col items-start px-6 pt-6">
            <h1 className="text-2xl font-bold">Edit Rack</h1>
            <p className="text-gray-500 text-sm">Update rack details</p>
          </CardHeader>
          <CardBody className="px-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <RackFormFields
                control={control}
                errors={errors}
                watch={watch}
                setValue={setValue}
                rackIdReadOnly
                clients={configs.clients}
                allPowerTypes={configs.allPowerTypes}
                rackPrices={configs.rackPrices}
                isInternalUser={isInternalUser}
                userClientName={user?.client_name}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="flat"
                  onPress={() => router.push("/racks")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  isLoading={isSubmitting}
                >
                  Update Rack
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
      <AlertModal
        isOpen={!!alertMessage}
        onClose={() => {
          setAlertMessage(null);
          if (shouldRedirect) router.push("/racks");
        }}
        title="Error"
        message={alertMessage || ""}
        buttonColor="danger"
      />
    </div>
  );
}
