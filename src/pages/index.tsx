import React, { useMemo, useState, useEffect, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { themeAlpine, colorSchemeDark } from "ag-grid-community";
import { useTheme } from "next-themes";
import { Button, Tooltip } from "@heroui/react";
import { getStatusStyle, getWithAuth } from "atlas-shared-web";
import CaseDetailDrawer from "../components/cases/case-detail-drawer";
import { EyeIcon } from "@heroicons/react/24/outline";
import { API_BASE } from "../lib/config";
import { Case } from "../types/case";

const TitleCellRenderer = (params: ICellRendererParams<Case>) => {
  const data = params.data;
  if (!data) return null;
  return <span className="font-medium">{data.title}</span>;
};

const CaseTypeCellRenderer = (params: ICellRendererParams<Case>) => {
  const caseType = params.value as string;
  return (
    <span className="font-medium">
      {caseType?.toUpperCase() || "N/A"}
    </span>
  );
};

const StatusCellRenderer = (params: ICellRendererParams<Case>) => {
  const status = params.value as string;
  const statusKey = status || "";
  return (
    <span className={getStatusStyle(statusKey)}>
      {statusKey.replace(/_/g, " ") || "N/A"}
    </span>
  );
};

const AssignedUserCellRenderer = (params: ICellRendererParams<Case>) => {
  const data = params.data;
  if (!data) return null;
  return (
    <div>
      <div className="font-medium">{data.assigned_user_name}</div>
    </div>
  );
};

const ClientCellRenderer = (params: ICellRendererParams<Case>) => {
  const data = params.data;
  if (!data) return null;

  if (!data.client_name) {
    return <span className="text-gray-400">N/A</span>;
  }

  return <span>{data.client_name}</span>;
};


export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [rowData, setRowData] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(undefined);
  const { resolvedTheme } = useTheme();
  
  const handleViewCase = useCallback((id: string) => {
    setSelectedCaseId(id);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedCaseId(undefined);
  }, []);

  useEffect(() => {
    setIsClient(true);
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await getWithAuth(`${API_BASE}/network/atlas-cases/v1/`);
      if (response.ok) {
        const data = await response.json();
        setRowData(data);
      }
    } catch (error) {
      console.error("Failed to fetch cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const ActionsCellRenderer = useCallback((params: ICellRendererParams<Case>) => {
    const data = params.data;
    if (!data) return null;
    return (
      <div className="h-full flex items-center gap-2">
        <Tooltip content="View" delay={1000}>
          <Button isIconOnly size="sm" variant="flat" color="primary" onPress={() => handleViewCase(data.case_id)}>
            <EyeIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    );
  }, [handleViewCase]);

  const gridTheme = resolvedTheme === "dark" ? themeAlpine.withPart(colorSchemeDark) : themeAlpine;

  const columnDefs = useMemo<ColDef<Case>[]>(() => [
    { headerName: "", cellRenderer: ActionsCellRenderer, width: 65, minWidth: 65, maxWidth: 65, flex: 0, resizable: false, sortable: false, filter: false, cellClass: "pt-1" },
    { field: "case_id", headerName: "ID", filter: true, sortable: true, width: 120 },
    { headerName: "Title", cellRenderer: TitleCellRenderer, filter: true, sortable: true, field: "title" },
    { field: "case_type", headerName: "Type", cellRenderer: CaseTypeCellRenderer, filter: true, sortable: true, width: 130 },
    { field: "case_status", headerName: "Status", cellRenderer: StatusCellRenderer, filter: true, sortable: true, width: 130, sort: "asc", sortIndex: 0, comparator: (a: string, b: string) => {
      const aIsPending = a?.toLowerCase() === "pending_approval" ? 0 : 1;
      const bIsPending = b?.toLowerCase() === "pending_approval" ? 0 : 1;
      return aIsPending - bIsPending;
    } },
    { field: "client_name", headerName: "Client", cellRenderer: ClientCellRenderer, filter: true, sortable: true, width: 180 },
    { field: "assigned_user_name", headerName: "Assigned To", cellRenderer: AssignedUserCellRenderer, filter: true, sortable: true, width: 160 },
    { field: "update_time", headerName: "Last Updated", filter: true, sortable: true, sort: "desc", sortIndex: 1, width: 180, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : "" },
  ], [ActionsCellRenderer]);

  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 80,
    resizable: true,
  }), []);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="p-4">
        <h1 className="text-2xl font-bold">Requests</h1>
        <p className="text-gray-500 text-sm">Manage change requests</p>
      </div>
      {isClient && (
        <div className="flex-1 overflow-hidden">
          <AgGridReact<Case>
            theme={gridTheme}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
            loading={loading}
            enableCellTextSelection={true}
            ensureDomOrder={true}
          />
        </div>
      )}
      <CaseDetailDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        caseId={selectedCaseId}
        onStatusChange={() => setTimeout(fetchCases, 1000)}
      />
    </div>
  );
}
