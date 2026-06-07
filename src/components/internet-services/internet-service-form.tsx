import React, { useState } from "react";
import { useRouter } from "next/router";
import { Button, Spinner } from "@heroui/react";
import { Stepper, AlertModal, useAuth, postWithAuth, putWithAuth } from "atlas-shared-web";
import StepInternetService from "./step-internet-service";
import StepReview from "./step-review";
import { InternetServiceFormData, InternetServiceReq, InternetServiceType } from "../../types/internet-service";
import { API_BASE } from "../../lib/config";
import { useInternetServiceConfigs } from "../../hooks/useInternetServiceConfigs";
import { useRack } from "../../hooks/useRack";

const STEPS = [
  { id: 1, label: "Internet\nService" },
  { id: 2, label: "Review" },
];

interface InternetServiceFormProps {
  initialData: InternetServiceFormData;
  internetServiceId?: string;
  mode: "create" | "edit";
  title: string;
  onDraftCreated?: (id: string) => void;
}

export default function InternetServiceForm({
  initialData,
  internetServiceId: initialInternetServiceId,
  mode,
  title,
  onDraftCreated,
}: InternetServiceFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isInternalUser = user?.internal ?? false;
  const configs = useInternetServiceConfigs(isInternalUser);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<InternetServiceFormData>(initialData);
  const [internetServiceId, setInternetServiceId] = useState<string | undefined>(initialInternetServiceId);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: "success" | "error" } | null>(null);

  const { rackInfo } = useRack(formData.rack_id);

  const updateFormData = (data: Partial<InternetServiceFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
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
    router.push("/internet-services");
  };

  const validateForm = (): string | null => {
    if (!formData.rack_id) {
      return "Please select a rack.";
    }

    if (!formData.start_date) {
      return "Please select a subscription start date.";
    }

    if (!formData.service_type) {
      return "Please select a service type.";
    }

    if (!formData.bandwidth) {
      return "Please select a bandwidth.";
    }

    if (formData.quantity < 1) {
      return "Quantity must be at least 1.";
    }

    return null;
  };

  const buildApiRequest = (): InternetServiceReq => {
    return {
      start_date: formData.start_date || null,
      rack_id: formData.rack_id,
      service_type: formData.service_type as InternetServiceType,
      bandwidth: formData.bandwidth,
      quantity: formData.quantity,
      remark: formData.remark || null,
      bgp_routing_lines: formData.bgp_routing_lines,
      dns_hosting_domains: formData.dns_hosting_domains,
      bgp_ipsec_configuration: formData.bgp_ipsec_configuration || null,
      router_maintenance: formData.router_maintenance || null,
      express_provisioning: formData.express_provisioning || null,
    };
  };

  const saveDraft = async (silent = false) => {
    const validationError = validateForm();
    if (validationError) {
      if (!silent) setAlert({ title: "Validation Error", message: validationError, type: "error" });
      throw new Error(validationError);
    }

    setIsSaving(true);
    try {
      const apiRequest = buildApiRequest();

      if (internetServiceId) {
        // Update existing
        const response = await putWithAuth(
          `${API_BASE}/network/internet-services/v1/${internetServiceId}/draft`,
          apiRequest
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Failed to update draft");
        }
      } else {
        // Create new
        const response = await postWithAuth(
          `${API_BASE}/network/internet-services/v1/draft`,
          apiRequest
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Failed to save draft");
        }
        const data = await response.json();
        setInternetServiceId(data.internet_service_id);
        onDraftCreated?.(data.internet_service_id);
      }

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
      const apiRequest = buildApiRequest();
      let serviceId = internetServiceId;

      // First save draft
      if (serviceId) {
        const response = await putWithAuth(
          `${API_BASE}/network/internet-services/v1/${serviceId}/draft`,
          apiRequest
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Failed to update draft");
        }
      } else {
        const response = await postWithAuth(
          `${API_BASE}/network/internet-services/v1/draft`,
          apiRequest
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Failed to create draft");
        }
        const data = await response.json();
        serviceId = data.internet_service_id;
      }

      // Submit for approval
      const submitResponse = await putWithAuth(
        `${API_BASE}/network/internet-services/v1/${serviceId}/status`,
        {
          entity_type: "INTERNET_SERVICE",
          entity_id: serviceId,
          status: "PENDING_APPROVAL",
          remark: formData.remark || "Submitted via portal",
        }
      );
      if (!submitResponse.ok) {
        const errorData = await submitResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to submit request");
      }

      setAlert({ title: "Success", message: "Request submitted successfully.", type: "success" });
      setTimeout(() => router.push("/internet-services"), 1500);
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
        return (
          <StepInternetService
            formData={formData}
            updateFormData={updateFormData}
            configs={configs}
          />
        );
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
