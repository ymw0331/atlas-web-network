import React, { useState } from "react";
import { useRouter } from "next/router";
import { Button, Spinner } from "@heroui/react";
import { Stepper, AlertModal, useAuth, postWithAuth, putWithAuth } from "atlas-shared-web";
import StepTimeService from "./step-time-service";
import StepReview from "./step-review";
import { TimeServiceFormData, TimeServiceReq } from "../../types/time-service";
import { API_BASE } from "../../lib/config";
import { useTimeServiceConfigs } from "../../hooks/useTimeServiceConfigs";
import { useRack } from "../../hooks/useRack";

const STEPS = [
  { id: 1, label: "Time Service" },
  { id: 2, label: "Review" },
];

interface TimeServiceFormProps {
  initialData: TimeServiceFormData;
  timeServiceIds?: string[];
  mode: "create" | "edit";
  title: string;
  onDraftCreated?: (ids: string[]) => void;
}

export default function TimeServiceForm({
  initialData,
  timeServiceIds: initialTimeServiceIds,
  mode,
  title,
  onDraftCreated,
}: TimeServiceFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isInternalUser = user?.internal ?? false;
  const configs = useTimeServiceConfigs(isInternalUser);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TimeServiceFormData>(initialData);
  const [timeServiceIds, setTimeServiceIds] = useState<string[]>(initialTimeServiceIds || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: "success" | "error" } | null>(null);

  const { rackInfo } = useRack(formData.rack_id);

  const updateFormData = (data: Partial<TimeServiceFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
      // Validate first and show error
      const validationError = validateForm();
      if (validationError) {
        setAlert({ title: "Validation Error", message: validationError, type: "error" });
        return;
      }

      try {
        await saveDraft(true);
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to save draft. Please try again.";
        setAlert({ title: "Error", message: errorMessage, type: "error" });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    router.push("/time-services");
  };

  // Services that require connector type selection
  const SERVICES_REQUIRING_CONNECTOR = ["GPS_SIGNAL_SINGLE", "GPS_SIGNAL_DUAL"];

  const validateForm = (): string | null => {
    if (!formData.rack_id) {
      return "Please select a rack.";
    }

    if (!formData.start_date) {
      return "Please select a subscription start date.";
    }

    if (formData.services.length === 0) {
      return "Please select a service type.";
    }

    // Check if GPS services have connector type selected
    for (const service of formData.services) {
      if (SERVICES_REQUIRING_CONNECTOR.includes(service.service_type) && !service.connector_type) {
        const serviceName = service.service_type === "GPS_SIGNAL_SINGLE"
          ? "GPS Signal Feed – Single"
          : "GPS Signal Feed – Dual";
        return `Please select a connector type for ${serviceName}.`;
      }
    }

    return null;
  };

  const saveDraft = async (silent = false) => {
    const validationError = validateForm();
    if (validationError) {
      if (!silent) setAlert({ title: "Validation Error", message: validationError, type: "error" });
      throw new Error(validationError);
    }

    setIsSaving(true);
    try {
      const newIds: string[] = [];

      // Create or update each service as a separate API call
      for (let i = 0; i < formData.services.length; i++) {
        const service = formData.services[i];
        const apiRequest: TimeServiceReq = {
          rack_id: formData.rack_id,
          service_type: service.service_type,
          connector_type: service.connector_type || null,
          quantity: service.quantity,
          start_date: formData.start_date || null,
          remark: formData.remark || null,
        };

        const existingId = timeServiceIds[i];

        if (existingId) {
          // Update existing
          const response = await putWithAuth(
            `${API_BASE}/network/time-services/v1/${existingId}/draft`,
            apiRequest
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Failed to update draft");
          }
          newIds.push(existingId);
        } else {
          // Create new
          const response = await postWithAuth(
            `${API_BASE}/network/time-services/v1/draft`,
            apiRequest
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Failed to save draft");
          }
          const data = await response.json();
          newIds.push(data.time_service_id);
        }
      }

      setTimeServiceIds(newIds);
      onDraftCreated?.(newIds);

      if (!silent) setAlert({ title: "Success", message: "Draft saved successfully.", type: "success" });
    } catch (error) {
      console.error("Failed to save draft:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save draft. Please try again.";
      if (!silent) setAlert({ title: "Error", message: errorMessage, type: "error" });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = () => saveDraft(false);

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setAlert({ title: "Validation Error", message: validationError, type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      // First save all drafts
      const newIds: string[] = [];

      for (let i = 0; i < formData.services.length; i++) {
        const service = formData.services[i];
        const apiRequest: TimeServiceReq = {
          rack_id: formData.rack_id,
          service_type: service.service_type,
          connector_type: service.connector_type || null,
          quantity: service.quantity,
          start_date: formData.start_date || null,
          remark: formData.remark || null,
        };

        const existingId = timeServiceIds[i];

        if (existingId) {
          const response = await putWithAuth(
            `${API_BASE}/network/time-services/v1/${existingId}/draft`,
            apiRequest
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Failed to update draft");
          }
          newIds.push(existingId);
        } else {
          const response = await postWithAuth(
            `${API_BASE}/network/time-services/v1/draft`,
            apiRequest
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Failed to create draft");
          }
          const data = await response.json();
          newIds.push(data.time_service_id);
        }
      }

      // Submit each for approval
      for (const id of newIds) {
        const submitResponse = await putWithAuth(
          `${API_BASE}/network/time-services/v1/${id}/status`,
          {
            entity_type: "TIME_SERVICE",
            entity_id: id,
            status: "PENDING_APPROVAL",
            remark: formData.remark || "Submitted via portal",
          }
        );
        if (!submitResponse.ok) {
          const errorData = await submitResponse.json().catch(() => ({}));
          throw new Error(errorData.detail || "Failed to submit request");
        }
      }

      setAlert({ title: "Success", message: "Request submitted successfully.", type: "success" });
      setTimeout(() => router.push("/time-services"), 1500);
    } catch (error) {
      console.error("Failed to submit:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit request. Please try again.";
      setAlert({ title: "Error", message: errorMessage, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNextButtonText = () => {
    switch (currentStep) {
      case 1:
        return "Review";
      case 2:
        return "Submit Request";
      default:
        return "Next";
    }
  };

  const renderStep = () => {
    if (configs.isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return <StepTimeService formData={formData} updateFormData={updateFormData} configs={configs} />;
      case 2:
        return (
          <StepReview
            formData={formData}
            updateFormData={updateFormData}
            configs={configs}
            rackInfo={rackInfo}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-4">{title}</h1>
        <Stepper steps={STEPS} currentStep={currentStep} />
      </div>

      <div className="mb-6">{renderStep()}</div>

      <div className="flex justify-between items-center">
        <Button variant="light" color="primary" onPress={handleCancel}>
          Cancel
        </Button>
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button variant="bordered" onPress={handleBack}>
              Back
            </Button>
          )}
          <Button
            variant="bordered"
            onPress={handleSaveDraft}
            isLoading={isSaving}
            isDisabled={isSaving || isSubmitting}
          >
            Save as draft
          </Button>
          <Button
            color="primary"
            onPress={currentStep === STEPS.length ? handleSubmit : handleNext}
            isDisabled={isSaving || isSubmitting}
            isLoading={currentStep === STEPS.length && isSubmitting}
            endContent={currentStep < STEPS.length ? <span>&rarr;</span> : null}
          >
            {getNextButtonText()}
          </Button>
        </div>
      </div>
      <AlertModal
        isOpen={!!alert}
        onClose={() => setAlert(null)}
        title={alert?.title || ""}
        message={alert?.message || ""}
        buttonColor={alert?.type === "success" ? "success" : "danger"}
      />
    </div>
  );
}
