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
import { Case } from "../../types/case";
import { CrossConnect } from "../../types/cross-connect";
import { Rack } from "../../types/rack";
import { ActivityItem } from "../../types/common";
import CrossConnectDetails from "../cross-connects/cross-connect-details";
import RackDetails from "../racks/rack-details";

interface CaseDetailsProps {
  caseData: Case;
}

const mockActivities: ActivityItem[] = [
  { id: "1", username: "Username", activity: "Activity", timestamp: "2 mins ago", status: "completed" },
  { id: "2", username: "Username", activity: "Activity", timestamp: "DD MMM YYYY HH:MM SGT", status: "in_progress" },
  { id: "3", username: "Username", activity: "Activity", timestamp: "DD MMM YYYY HH:MM SGT", status: "pending_approval" },
  { id: "4", username: "Username", activity: "Activity", timestamp: "DD MMM YYYY HH:MM SGT", status: "pending_atlas_review" },
  { id: "5", username: "Username", activity: "Activity", timestamp: "DD MMM YYYY HH:MM SGT", status: "assigned" },
];

export default function CaseDetails({ caseData }: CaseDetailsProps) {
  const [selectedActivityTab, setSelectedActivityTab] = useState("history");

  const entityType = caseData.entity_type?.toUpperCase();
  const isCrossConnect = entityType === "CROSS_CONNECT";
  const isRack = entityType === "RACK";
  const statusKey = caseData.case_status || "";

  return (
    <>
      {/* Case Details */}
      <Card className="mb-4">
        <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <h2 className="text-base font-medium">Case Details</h2>
        </CardHeader>
        <CardBody className="px-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Case Type</p>
              <p className="font-medium">{caseData.case_type?.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span className={getStatusStyle(statusKey)}>
                {statusKey.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Client</p>
              <p className="font-medium">{caseData.client_name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Assigned To</p>
              <p className="font-medium">{caseData.assigned_user_name || "Unassigned"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Entity Type</p>
              <p className="font-medium">{caseData.entity_type || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Entity ID</p>
              <p className="font-medium">{caseData.entity_id || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Created</p>
              <p className="font-medium">{caseData.create_time ? new Date(caseData.create_time).toLocaleString() : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Last Updated</p>
              <p className="font-medium">{caseData.update_time ? new Date(caseData.update_time).toLocaleString() : "N/A"}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Entity Details - Cross Connect, Rack, or Other */}
      {isCrossConnect && caseData.data ? (
        <CrossConnectDetails crossConnect={caseData.data as unknown as CrossConnect} hideActivity />
      ) : isRack && caseData.data ? (
        <RackDetails rack={caseData.data as unknown as Rack} hideActivity />
      ) : (
        caseData.data && Object.keys(caseData.data).length > 0 && (
          <Card className="mb-4">
            <CardHeader className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
              <h2 className="text-base font-medium">Additional Data</h2>
            </CardHeader>
            <CardBody className="px-4 py-4">
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(caseData.data, null, 2)}
              </pre>
            </CardBody>
          </Card>
        )
      )}

      {/* Activity */}
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
    </>
  );
}
