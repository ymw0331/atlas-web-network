import React from "react";
import { Button, Textarea, Card, CardHeader, CardBody, Tooltip } from "@heroui/react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { ColoFormData } from "../../types/co-location";
import { ColocationConfigs } from "../../hooks/useColocationConfigs";
import FeeSummaryTable from "./fee-summary-table";

interface StepReviewProps {
  formData: ColoFormData;
  updateFormData: (data: Partial<ColoFormData>) => void;
  onEditStep: (step: number) => void;
  configs: ColocationConfigs;
}

export default function StepReview({ formData, updateFormData, onEditStep, configs }: StepReviewProps) {
  return (
    <div className="space-y-6">
      {/* Subscription Start Date Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Subscription Start Date and Term</h3>
        </CardHeader>
        <CardBody className="px-4 py-4">
          <div className="flex items-center gap-6">
            <Tooltip content="Edit">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                color="warning"
                onPress={() => onEditStep(1)}
              >
                <PencilSquareIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            <div className="flex-1 max-w-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Client</p>
              <p className="text-base">{formData.client_name || "—"}</p>
            </div>
            <div className="flex-1 max-w-3xs">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</p>
              <p className="text-base">{formData.startDate || "—"}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Combined Fees Table Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Fee Summary</h3>
        </CardHeader>
        <CardBody className="px-0 py-0">
          <FeeSummaryTable
            rackSpecs={formData.rackSpecs}
            networkTradingApp={formData.networkTradingApp}
            networkNonTradingApp={formData.networkNonTradingApp}
            networkGiftConnect={formData.networkGiftConnect}
            remoteHandsServices={formData.remoteHandsServices}
            configs={configs}
            onEditStep={onEditStep}
          />
        </CardBody>
      </Card>

      {/* Remarks Card */}
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h3 className="text-base font-medium">Remarks (if any)</h3>
        </CardHeader>
        <CardBody className="px-4 py-4">
          <Textarea
            placeholder="Enter any additional remarks..."
            value={formData.remarks}
            onValueChange={(val) => updateFormData({ remarks: val })}
            minRows={4}
          />
        </CardBody>
      </Card>
    </div>
  );
}
