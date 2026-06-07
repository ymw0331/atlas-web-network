import { useState } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
} from "@heroui/react";
import { putWithAuth } from "atlas-shared-web";
import { ConfirmModal, AlertModal } from "atlas-shared-web/components";
import { API_BASE } from "../../lib/config";
import { Case } from "../../types/case";

interface CrossConnectCaseActionsProps {
  caseData: Case;
  onStatusChange?: () => void;
  onClose?: () => void;
}

export default function CrossConnectCaseActions({
  caseData,
  onStatusChange,
  onClose,
}: CrossConnectCaseActionsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"approve" | "reject" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [portLabelModalOpen, setPortLabelModalOpen] = useState(false);
  const [sourcePortLabel, setSourcePortLabel] = useState("");
  const [targetPortLabel, setTargetPortLabel] = useState("");

  const status = caseData.case_status?.toUpperCase();
  const showActions = ["PENDING_APPROVAL", "PENDING_DCOPS"].includes(status);

  const getApproveLabel = () => {
    if (status === "PENDING_APPROVAL") {
      return "Send to DC Ops";
    }
    return "Complete DCOPS setup";
  };

  const getModalTitle = () => {
    if (modalAction === "approve") {
      if (status === "PENDING_APPROVAL") {
        return "Send to DC Ops?";
      }
      return "Approve case?";
    }
    return "Reject case?";
  };

  const openModal = (action: "approve" | "reject") => {
    if (action === "approve" && status === "PENDING_DCOPS") {
      setPortLabelModalOpen(true);
    } else {
      setModalAction(action);
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalAction(null);
  };

  const closePortLabelModal = () => {
    setPortLabelModalOpen(false);
    setSourcePortLabel("");
    setTargetPortLabel("");
  };

  const handleConfirm = async () => {
    if (!modalAction) return;
    setIsSubmitting(true);
    try {
      const entityId = caseData.entity_id;
      const caseId = caseData.case_id;
      const baseUrl = `${API_BASE}/network/cross-connects/v1/${entityId}/workflow/${caseId}`;

      let response;
      if (modalAction === "approve") {
        if (status === "PENDING_APPROVAL") {
          response = await putWithAuth(`${baseUrl}/update_to_pending_dcops`, {});
        }
      } else if (modalAction === "reject") {
        response = await putWithAuth(`${baseUrl}/update_to_rejected`, {});
      }

      if (response?.ok) {
        closeModal();
        onStatusChange?.();
        onClose?.();
      }
    } catch (error) {
      console.error(`Failed to ${modalAction} case:`, error);
      closeModal();
      setAlertMessage(`Failed to ${modalAction} case. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteDcOps = async () => {
    if (!sourcePortLabel.trim() || !targetPortLabel.trim()) return;
    setIsSubmitting(true);
    try {
      const entityId = caseData.entity_id;
      const caseId = caseData.case_id;
      const url = `${API_BASE}/network/cross-connects/v1/${entityId}/workflow/${caseId}/complete_dcops`;

      const response = await putWithAuth(url, {
        source_port_label: sourcePortLabel.trim(),
        target_port_label: targetPortLabel.trim(),
      });

      if (response?.ok) {
        closePortLabelModal();
        onStatusChange?.();
        onClose?.();
      }
    } catch (error) {
      console.error("Failed to complete DC Ops:", error);
      closePortLabelModal();
      setAlertMessage("Failed to complete DC Ops. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showActions) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2 mb-4">
        <Button color="success" onPress={() => openModal("approve")}>
          {getApproveLabel()}
        </Button>
        <Button color="danger" onPress={() => openModal("reject")}>
          Reject
        </Button>
      </div>
      <ConfirmModal
        isOpen={modalOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title={getModalTitle()}
        message={`${caseData.title}${caseData.client_name ? ` (${caseData.client_name})` : ""}`}
        confirmText={modalAction === "approve" ? getApproveLabel() : "Reject"}
        confirmColor={modalAction === "approve" ? "success" : "danger"}
        isLoading={isSubmitting}
      />
      <Modal isOpen={portLabelModalOpen} onClose={closePortLabelModal}>
        <ModalContent>
          <ModalHeader>Complete DC Ops</ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-500 mb-4">
              {caseData.title}{caseData.client_name ? ` (${caseData.client_name})` : ""}
            </p>
            <div className="flex flex-col gap-4">
              <Input
                label="Source Port Label"
                placeholder="Enter source port label"
                value={sourcePortLabel}
                onValueChange={setSourcePortLabel}
                maxLength={100}
                isRequired
              />
              <Input
                label="Target Port Label"
                placeholder="Enter target port label"
                value={targetPortLabel}
                onValueChange={setTargetPortLabel}
                maxLength={100}
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={closePortLabelModal}>
              Cancel
            </Button>
            <Button
              color="success"
              onPress={handleCompleteDcOps}
              isLoading={isSubmitting}
              isDisabled={!sourcePortLabel.trim() || !targetPortLabel.trim()}
            >
              Complete DCOPS setup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
