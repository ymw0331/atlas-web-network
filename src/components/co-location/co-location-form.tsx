import React, { useState } from "react";
import { useRouter } from "next/router";
import { Button, Spinner } from "@heroui/react";
import { Stepper, AlertModal, useAuth, postWithAuth, putWithAuth } from "atlas-shared-web";
import StepRacks from "./step-racks";
import StepNetwork from "./step-network";
import StepReview from "./step-review";
import { ColoFormData, CoLocationReq } from "../../types/co-location";
import { API_BASE } from "../../lib/config";
import { useColocationConfigs } from "../../hooks/useColocationConfigs";

const STEPS = [
  { id: 1, label: "Rack\nSpecifications" },
  { id: 2, label: "Network" },
  { id: 3, label: "Review" },
];

// Convert form data to API request format
const toApiRequest = (formData: ColoFormData): CoLocationReq => ({
  client_id: formData.client_id,
  client_name: formData.client_name,
  start_date: formData.startDate || undefined,
  remarks: formData.remarks || undefined,
  rackSpecs: formData.rackSpecs,
  networkTradingApp: formData.networkTradingApp,
  networkNonTradingApp: formData.networkNonTradingApp,
  networkGiftConnect: formData.networkGiftConnect,
  remoteHandsServices: formData.remoteHandsServices,
});

interface CoLocationFormProps {
  initialData: ColoFormData;
  coLocationId?: string;
  mode: "create" | "edit";
  title: string;
  onDraftCreated?: (id: string) => void;
}

export default function CoLocationForm({
  initialData,
  coLocationId: initialCoLocationId,
  mode,
  title,
  onDraftCreated,
}: CoLocationFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isInternalUser = user?.internal ?? false;
  const configs = useColocationConfigs(isInternalUser);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ColoFormData>(initialData);
  const [coLocationId, setCoLocationId] = useState<string | undefined>(initialCoLocationId);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: "success" | "error" } | null>(null);

  const updateFormData = (data: Partial<ColoFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
      try {
        await saveDraft(true);
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      } catch {
        setAlert({ title: "Error", message: "Failed to auto-save draft. Please try again.", type: "error" });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    router.push("/co-location");
  };

  const saveDraft = async (silent = false) => {
    setIsSaving(true);
    try {
      const apiRequest = toApiRequest(formData);

      if (coLocationId) {
        const response = await putWithAuth(
          `${API_BASE}/network/co-locations/v1/${coLocationId}/draft`,
          apiRequest
        );
        if (!response.ok) throw new Error("Failed to update draft");
      } else {
        const response = await postWithAuth(
          `${API_BASE}/network/co-locations/v1/draft`,
          apiRequest
        );
        if (!response.ok) throw new Error("Failed to save draft");
        const data = await response.json();
        setCoLocationId(data.co_location_id);
        // Notify parent and update URL with new draft ID
        onDraftCreated?.(data.co_location_id);
        router.replace(`/co-location/create?id=${data.co_location_id}`, undefined, { shallow: true });
      }
      if (!silent) setAlert({ title: "Success", message: "Draft saved successfully.", type: "success" });
    } catch (error) {
      console.error("Failed to save draft:", error);
      if (!silent) setAlert({ title: "Error", message: "Failed to save draft. Please try again.", type: "error" });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = () => saveDraft(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const apiRequest = toApiRequest(formData);
      let id = coLocationId;

      if (!id) {
        const draftResponse = await postWithAuth(
          `${API_BASE}/network/co-locations/v1/draft`,
          apiRequest
        );
        if (!draftResponse.ok) throw new Error("Failed to create draft");
        const draftData = await draftResponse.json();
        id = draftData.co_location_id;
        setCoLocationId(id);
      } else {
        const updateResponse = await putWithAuth(
          `${API_BASE}/network/co-locations/v1/${id}/draft`,
          apiRequest
        );
        if (!updateResponse.ok) throw new Error("Failed to update draft");
      }

      const submitResponse = await putWithAuth(
        `${API_BASE}/network/co-locations/v1/${id}/status`,
        {
          entity_type: "CO_LOCATION",
          entity_id: id,
          status: "PENDING_APPROVAL",
          remark: formData.remarks || "Submitted via portal",
        }
      );
      if (!submitResponse.ok) throw new Error("Failed to submit request");

      setAlert({ title: "Success", message: "Request submitted successfully.", type: "success" });
      setTimeout(() => router.push("/co-location"), 1500);
    } catch (error) {
      console.error("Failed to submit:", error);
      setAlert({ title: "Error", message: "Failed to submit request. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNextButtonText = () => {
    switch (currentStep) {
      case 1:
        return "Network";
      case 2:
        return "Review Responses";
      case 3:
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
        return <StepRacks formData={formData} updateFormData={updateFormData} configs={configs} />;
      case 2:
        return <StepNetwork formData={formData} updateFormData={updateFormData} configs={configs} />;
      case 3:
        return <StepReview formData={formData} updateFormData={updateFormData} onEditStep={setCurrentStep} configs={configs} />;
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
