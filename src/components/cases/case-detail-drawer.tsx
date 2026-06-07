import React, { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Button,
  Spinner,
} from "@heroui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getWithAuth, putWithAuth } from "atlas-shared-web";
import { API_BASE } from "../../lib/config";
import { Case } from "../../types/case";
import CaseDetails from "./case-details";
import { ConfirmModal } from "atlas-shared-web/components";
import CrossConnectCaseActions from "../cross-connects/cross-connect-case-actions";

interface CaseDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  onStatusChange?: () => void;
}

export default function CaseDetailDrawer({
  isOpen,
  onClose,
  caseId,
  onStatusChange,
}: CaseDetailDrawerProps) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"approve" | "reject" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCase = useCallback(async () => {
    if (!caseId) return;
    setIsLoading(true);
    try {
      const response = await getWithAuth(`${API_BASE}/network/atlas-cases/v1/${caseId}`);
      if (response.ok) {
        const data = await response.json();
        setCaseData(data);
      }
    } catch (error) {
      console.error("Failed to fetch case:", error);
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (isOpen && caseId) {
      fetchCase();
    }
  }, [isOpen, caseId, fetchCase]);

  const openModal = (action: "approve" | "reject") => {
    setModalAction(action);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalAction(null);
  };

  const handleConfirm = async () => {
    if (!caseData || !modalAction) return;
    setIsSubmitting(true);
    try {
      const status = modalAction === "approve" ? "APPROVED" : "REJECTED";
      const payload: Record<string, string> = {
        case_status: status,
        assigned_user_id: "",
        assigned_user_name: "",
        remark: status.charAt(0) + status.slice(1).toLowerCase(),
      };
      const response = await putWithAuth(`${API_BASE}/network/atlas-cases/v1/${caseData.case_id}/status`, payload);
      if (response.ok) {
        closeModal();
        onStatusChange?.();
        onClose();
      }
    } catch (error) {
      console.error(`Failed to ${modalAction} case:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showActions = caseData && !["approved", "rejected", "closed"].includes(caseData.case_status?.toLowerCase());

  return (
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
        ) : caseData ? (
          <>
            <DrawerHeader className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
              <div>
                <h1 className="text-xl font-semibold">{caseData.title}</h1>
                <p className="text-sm text-gray-500">Case ID: {caseData.case_id}</p>
              </div>
              <Button
                isIconOnly
                variant="light"
                onPress={onClose}
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </DrawerHeader>
            <DrawerBody className="p-4 !block">
              {caseData.entity_type === "CROSS_CONNECT" ? (
                <CrossConnectCaseActions
                  caseData={caseData}
                  onStatusChange={onStatusChange}
                  onClose={onClose}
                />
              ) : (
                showActions && (
                  <div className="flex gap-2 mb-4">
                    <Button color="success" onPress={() => openModal("approve")}>
                      Approve
                    </Button>
                    <Button color="danger" onPress={() => openModal("reject")}>
                      Reject
                    </Button>
                  </div>
                )
              )}
              <CaseDetails caseData={caseData} />
            </DrawerBody>
          </>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Case not found</p>
          </div>
        )}
      </DrawerContent>
      <ConfirmModal
        isOpen={modalOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title={modalAction === "approve" ? "Approve case?" : "Reject case?"}
        message={caseData ? `${caseData.title}${caseData.client_name ? ` (${caseData.client_name})` : ""}` : ""}
        confirmText={modalAction === "approve" ? "Approve" : "Reject"}
        confirmColor={modalAction === "approve" ? "success" : "danger"}
        isLoading={isSubmitting}
      />
    </Drawer>
  );
}
