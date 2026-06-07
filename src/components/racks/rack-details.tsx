import React, { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
} from "@heroui/react";
import { ClockIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { getStatusStyle } from "atlas-shared-web";
import { Rack } from "../../types/rack";
import { ActivityItem } from "../../types/common";

interface RackDetailsProps {
  rack: Rack;
  hideActivity?: boolean;
  tierOptions?: Record<string, string>;
  typeOptions?: Record<string, string>;
  powerOptions?: Record<string, string>;
}

const mockActivities: ActivityItem[] = [
  { id: "1", username: "Username", activity: "Activity", timestamp: "2 mins ago", status: "completed" },
  { id: "2", username: "Username", activity: "Activity", timestamp: "DD MMM YYYY HH:MM SGT", status: "in_progress" },
  { id: "3", username: "Username", activity: "Activity", timestamp: "DD MMM YYYY HH:MM SGT", status: "pending_approval" },
  { id: "4", username: "Username", activity: "Activity", timestamp: "DD MMM YYYY HH:MM SGT", status: "pending_atlas_review" },
  { id: "5", username: "Username", activity: "Activity", timestamp: "DD MMM YYYY HH:MM SGT", status: "assigned" },
];

export default function RackDetails({ rack, hideActivity = false, tierOptions = {}, typeOptions = {}, powerOptions = {} }: RackDetailsProps) {
  const [selectedActivityTab, setSelectedActivityTab] = useState("history");

  const statusKey = rack.rack_status || "";

  return (
    <>
      {/* Rack Details */}
      <Card className="mb-4">
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h2 className="text-base font-medium">Rack Details</h2>
        </CardHeader>
        <CardBody className="px-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Rack ID</p>
              <p className="font-medium">{rack.rack_id || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span className={getStatusStyle(statusKey)}>
                {statusKey.replace(/_/g, " ") || "-"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Tier</p>
              <p className="font-medium">{tierOptions[rack.rack_tier] || rack.rack_tier || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Type</p>
              <p className="font-medium">{typeOptions[rack.rack_type] || rack.rack_type?.replace("_", " ") || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Power</p>
              <p className="font-medium">{powerOptions[rack.power] || rack.power?.replace(/_/g, " ") || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">800mm Width Full Rack</p>
              <p className="font-medium">{rack.is_800mm_width_full_rack ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Reserve Standard Full Rack next to existing Subscriber Rack</p>
              <p className="font-medium">{rack.reserve_standard_full_rack ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Reserve 800mm Full Rack next to existing Subscriber Rack</p>
              <p className="font-medium">{rack.reserve_800mm_full_rack ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Client</p>
              <p className="font-medium">{rack.client_name || "Unassigned"}</p>
              {rack.client_id && (
                <p className="text-sm text-gray-400">{rack.client_id}</p>
              )}
            </div>
          </div>
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
                    <span className={getStatusStyle(activity.status)}>
                      {activity.status.toUpperCase().replace(/_/g, " ")}
                    </span>
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
