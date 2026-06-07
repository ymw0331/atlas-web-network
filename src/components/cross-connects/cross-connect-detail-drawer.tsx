import { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Button,
  Spinner,
} from "@heroui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getWithAuth } from "atlas-shared-web";
import { API_BASE } from "../../lib/config";
import { CrossConnect } from "../../types/cross-connect";
import CrossConnectDetails from "./cross-connect-details";

interface CrossConnectDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  crossConnectId?: string;
}

export default function CrossConnectDetailDrawer({
  isOpen,
  onClose,
  crossConnectId,
}: CrossConnectDetailDrawerProps) {
    const [crossConnect, setCrossConnect] = useState<CrossConnect | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCrossConnect = useCallback(async () => {
    if (!crossConnectId) return;
    setIsLoading(true);
    try {
      const response = await getWithAuth(`${API_BASE}/network/cross-connects/v1/${crossConnectId}`);
      if (response.ok) {
        const data = await response.json();
        setCrossConnect(data);
      }
    } catch (error) {
      console.error("Failed to fetch cross-connect:", error);
    } finally {
      setIsLoading(false);
    }
  }, [crossConnectId]);

  useEffect(() => {
    if (isOpen && crossConnectId) {
      fetchCrossConnect();
    }
  }, [isOpen, crossConnectId, fetchCrossConnect]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      placement="right"
      hideCloseButton
      className="max-w-6xl"
    >
      <DrawerContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner size="lg" />
          </div>
        ) : crossConnect ? (
          <>
            <DrawerHeader className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
              <div>
                <h1 className="text-xl font-semibold">Cross Connection</h1>
                <p className="text-sm text-gray-500">Cross Connect ID: {crossConnect.cross_connect_id}</p>
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
              <CrossConnectDetails crossConnect={crossConnect} />
            </DrawerBody>
          </>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Cross-connect not found</p>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
