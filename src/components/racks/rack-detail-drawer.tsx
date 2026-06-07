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
import { getWithAuth, AtlasConfig } from "atlas-shared-web";
import { API_BASE } from "../../lib/config";
import { Rack } from "../../types/rack";
import RackDetails from "./rack-details";

interface RackDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rackId?: string;
}

export default function RackDetailDrawer({
  isOpen,
  onClose,
  rackId,
}: RackDetailDrawerProps) {
    const [rack, setRack] = useState<Rack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tierOptions, setTierOptions] = useState<Record<string, string>>({});
  const [powerOptions, setPowerOptions] = useState<Record<string, string>>({});

  const fetchRackConfigs = useCallback(async () => {
    try {
      const response = await getWithAuth(`${API_BASE}/network/atlas-configs/v1/RACK`);
      if (response.ok) {
        const data: AtlasConfig[] = await response.json();
        const tierConfig = data.find(c => c.field_name === "RACK_TIER");
        const powerConfig = data.find(c => c.field_name === "RACK_POWER");
        if (tierConfig) setTierOptions(tierConfig.options);
        if (powerConfig) setPowerOptions(powerConfig.options);
      }
    } catch (error) {
      console.error("Failed to fetch rack configs:", error);
    }
  }, []);

  const fetchRack = useCallback(async () => {
    if (!rackId) return;
    setIsLoading(true);
    try {
      const response = await getWithAuth(`${API_BASE}/network/racks/v1/${rackId}`);
      if (response.ok) {
        const data = await response.json();
        setRack(data);
      }
    } catch (error) {
      console.error("Failed to fetch rack:", error);
    } finally {
      setIsLoading(false);
    }
  }, [rackId]);

  useEffect(() => {
    if (isOpen && rackId) {
      fetchRack();
      fetchRackConfigs();
    }
  }, [isOpen, rackId, fetchRack, fetchRackConfigs]);

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
        ) : rack ? (
          <>
            <DrawerHeader className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
              <div>
                <h1 className="text-xl font-semibold">Rack</h1>
                <p className="text-sm text-gray-500">Rack ID: {rack.rack_id}</p>
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
              <RackDetails rack={rack} tierOptions={tierOptions} powerOptions={powerOptions} />
            </DrawerBody>
          </>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Rack not found</p>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
