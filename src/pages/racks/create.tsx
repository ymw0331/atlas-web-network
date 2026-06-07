import { useState, useEffect } from "react";
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
import { useAuth, postWithAuth } from "atlas-shared-web";
import RackFormFields from "../../components/racks/rack-form-fields";
import { API_BASE } from "../../lib/config";
import { RackCreateForm } from "../../types/rack";
import { useRackConfigs } from "../../hooks/useRackConfigs";

export default function CreateRack() {
  const router = useRouter();
  const { user } = useAuth();
  const isInternalUser = user?.internal ?? false;
  const configs = useRackConfigs(isInternalUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<RackCreateForm>({
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

  // Auto-populate client for external users
  useEffect(() => {
    if (!isInternalUser && user?.client_id) {
      setValue("client_id", user.client_id);
      setValue("client_name", user.client_name);
    }
  }, [isInternalUser, user?.client_id, user?.client_name, setValue]);

  const onSubmit = async (data: RackCreateForm) => {
    setIsSubmitting(true);
    try {
      const response = await postWithAuth(`${API_BASE}/network/racks/v1/draft`, data);
      if (response.ok) {
        router.push("/racks");
      } else {
        const error = await response.json();
        setAlertMessage(error.detail || "Failed to create rack. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create rack:", error);
      setAlertMessage("Failed to create rack. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (configs.isLoading) {
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
            <h1 className="text-2xl font-bold">Create Rack</h1>
            <p className="text-gray-500 text-sm">Add a new rack to the system</p>
          </CardHeader>
          <CardBody className="px-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <RackFormFields
                control={control}
                errors={errors}
                watch={watch}
                setValue={setValue}
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
                  Create Rack
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
      <AlertModal
        isOpen={!!alertMessage}
        onClose={() => setAlertMessage(null)}
        title="Error"
        message={alertMessage || ""}
        buttonColor="danger"
      />
    </div>
  );
}
