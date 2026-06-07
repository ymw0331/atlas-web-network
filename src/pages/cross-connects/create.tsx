import React, { useState } from "react";
import { useRouter } from "next/router";
import { AlertModal, postWithAuth, putWithAuth } from "atlas-shared-web";
import { API_BASE } from "../../lib/config";
import { CrossConnectApiPayload } from "../../types/cross-connect";
import CrossConnectForm from "../../components/cross-connects/cross-connect-form";

export default function CreateCrossConnect() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  const handleSubmit = async (payload: CrossConnectApiPayload) => {
    setIsSubmitting(true);
    try {
      let crossConnectId = draftId;

      // Step 1 or 2: Create or update draft
      if (!crossConnectId) {
        // Create new draft
        const createResponse = await postWithAuth(
          `${API_BASE}/network/cross-connects/v1/draft`,
          payload
        );
        if (!createResponse.ok) {
          const error = await createResponse.json();
          setAlertMessage(error.detail || "Failed to create draft");
          return;
        }
        const createdData = await createResponse.json();
        crossConnectId = createdData.cross_connect_id;
      } else {
        // Update existing draft
        const updateResponse = await putWithAuth(
          `${API_BASE}/network/cross-connects/v1/${crossConnectId}/draft`,
          payload
        );
        if (!updateResponse.ok) {
          const error = await updateResponse.json();
          setAlertMessage(error.detail || "Failed to update draft");
          return;
        }
      }

      // Step 3: Submit draft
      const submitResponse = await putWithAuth(
        `${API_BASE}/network/cross-connects/v1/${crossConnectId}/workflow/submit_draft`,
        {}
      );

      if (submitResponse.ok) {
        router.push("/cross-connects");
      } else {
        const error = await submitResponse.json();
        setAlertMessage(error.detail || "Failed to submit draft");
      }
    } catch (error) {
      console.error("Failed to submit cross-connect request:", error);
      setAlertMessage("Failed to submit cross-connect request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (payload: CrossConnectApiPayload) => {
    setIsSavingDraft(true);
    try {
      let response;
      if (!draftId) {
        // Create new draft
        response = await postWithAuth(
          `${API_BASE}/network/cross-connects/v1/draft`,
          payload
        );
      } else {
        // Update existing draft
        response = await putWithAuth(
          `${API_BASE}/network/cross-connects/v1/${draftId}/draft`,
          payload
        );
      }

      if (response.ok) {
        const data = await response.json();
        setDraftId(data.cross_connect_id);
        router.push("/cross-connects");
      } else {
        const error = await response.json();
        setAlertMessage(error.detail || "Failed to save draft");
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      setAlertMessage("Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <CrossConnectForm
          mode="create"
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          onCancel={() => router.push("/cross-connects")}
          isSubmitting={isSubmitting}
          isSavingDraft={isSavingDraft}
        />
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
