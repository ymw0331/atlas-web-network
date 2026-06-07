import React, { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Tabs,
  Tab,
} from "@heroui/react";
import { ClockIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { getStatusStyle } from "atlas-shared-web";
import { CrossConnect } from "../../types/cross-connect";
import { ActivityItem } from "../../types/common";

interface CrossConnectDetailsProps {
  crossConnect: CrossConnect;
  hideActivity?: boolean;
}

const mockActivities: ActivityItem[] = [
  { id: "1", username: "Username", activity: "Activity", timestamp: "2 mins ago", status: "completed" },
  { id: "2", username: "Username", activity: "Activity", timestamp: "DD MMM YYYY HH:MM SGT", status: "in_progress" },
  { id: "3", username: "Username", activity: "Activity", timestamp: "DD MMM YYYY HH:MM SGT", status: "pending_approval" },
  { id: "4", username: "Username", activity: "Activity", timestamp: "DD MMM YYYY HH:MM SGT", status: "pending_atlas_review" },
  { id: "5", username: "Username", activity: "Activity", timestamp: "DD MMM YYYY HH:MM SGT", status: "assigned" },
];

export default function CrossConnectDetails({ crossConnect, hideActivity = false }: CrossConnectDetailsProps) {
  const [selectedActivityTab, setSelectedActivityTab] = useState("history");

  const statusKey = crossConnect.cross_connect_status || "";

  return (
    <>
      {/* Cross-Connection Details */}
      <Card className="mb-4">
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h2 className="text-base font-medium">Cross-Connection Details</h2>
        </CardHeader>
        <CardBody className="px-4 py-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Cross Connect ID</p>
              <p className="font-medium">{crossConnect.cross_connect_id || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span className={getStatusStyle(statusKey)}>
                {statusKey.replace(/_/g, " ") || "-"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Cable Type</p>
              <p className="font-medium">CAT 6</p>
            </div>
          </div>
          <div className="mb-4">
            <span className="text-gray-600 dark:text-gray-400">
              Monthly Cost: <span className="font-semibold">SGD 250</span>; One-time Cost: <span className="font-semibold">SGD 500</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Source Rack ID</p>
              <p className="font-medium">{crossConnect.source_rack_id || "-"}</p>
              <p className="text-sm text-gray-500 mt-2 mb-1">Source Client</p>
              <p className="font-medium">{crossConnect.source_client_name || "-"}</p>
              <p className="text-sm text-gray-500 mt-2 mb-1">Source Port Label</p>
              <p className="font-medium">{crossConnect.source_port_label || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Target Rack ID</p>
              <p className="font-medium">{crossConnect.target_rack_id || "-"}</p>
              <p className="text-sm text-gray-500 mt-2 mb-1">Target Client</p>
              <p className="font-medium">{crossConnect.target_client_name || "-"}</p>
              <p className="text-sm text-gray-500 mt-2 mb-1">Target Port Label</p>
              <p className="font-medium">{crossConnect.target_port_label || "-"}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Additional Services */}
      <Card className="mb-4">
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h2 className="text-base font-medium">Additional Services</h2>
        </CardHeader>
        <CardBody className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Express Provisioning</p>
              <p className="text-sm text-gray-500">Additional one-time cost SGD 600</p>
            </div>
            <Chip color={crossConnect.express_provisioning ? "success" : "default"} variant="flat" size="sm">
              {crossConnect.express_provisioning ? "INCLUDED" : "NOT INCLUDED"}
            </Chip>
          </div>
        </CardBody>
      </Card>

      {/* Summary */}
      <Card className="mb-4">
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h2 className="text-base font-medium">Summary</h2>
        </CardHeader>
        <CardBody className="px-4 py-0">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="flex justify-between py-3">
              <span className="text-gray-500">Service</span>
              <span className="font-medium">Cross-connect between 2 racks</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-500">Circuit Reference</span>
              <span className="font-medium">-</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-500">List Price</span>
              <span className="font-medium">SGD 600.00</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Reason for cross-connection */}
      <Card className="mb-4">
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h2 className="text-base font-medium">
            Reason for cross-connection between different participants and/or rack subscription tiers
          </h2>
        </CardHeader>
        <CardBody className="px-4 py-4">
          <p className="text-gray-600 dark:text-gray-400">
            {crossConnect.remark || "No reason provided"}
          </p>
        </CardBody>
      </Card>

      {/* Cabling Details */}
      <Card className="mb-4">
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h2 className="text-base font-medium">Cabling Details</h2>
        </CardHeader>
        <CardBody className="px-4 py-4">
          <Button color="primary">
            Generate Log File
          </Button>
        </CardBody>
      </Card>

      {/* Activity */}
      {!hideActivity && (
        <Card className="mb-4">
          <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
            <h2 className="text-base font-medium">Activity</h2>
          </CardHeader>
          <CardBody className="px-4 py-4">
            <Tabs
              selectedKey={selectedActivityTab}
              onSelectionChange={(key) => setSelectedActivityTab(key as string)}
              variant="underlined"
              classNames={{
                tabList: "gap-6 border-b border-gray-200 dark:border-gray-700",
                cursor: "bg-primary",
                tab: "px-0 h-10",
              }}
            >
              <Tab key="all" title="All" />
              <Tab key="remarks" title="Remarks" />
              <Tab key="history" title="History" />
            </Tabs>

            <div className="mt-4 space-y-4">
              {mockActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 py-2">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{activity.username}</span>
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{activity.timestamp}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{activity.activity}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Chip
                      color="default"
                      variant="flat"
                      size="sm"
                    >
                      {activity.status.toUpperCase().replace(/_/g, " ")}
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}
