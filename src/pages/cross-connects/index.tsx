import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { themeAlpine, colorSchemeDark } from "ag-grid-community";
import { useTheme } from "next-themes";
import { Button, Tooltip } from "@heroui/react";
import CrossConnectDetailDrawer from "../../components/cross-connects/cross-connect-detail-drawer";
import { EyeIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { getStatusStyle, getWithAuth, useAuth } from "atlas-shared-web";
import { API_BASE } from "../../lib/config";
import { CrossConnect } from "../../types/cross-connect";

const StatusCellRenderer = (params: ICellRendererParams<CrossConnect>) => {
  const status = params.value as string;
  const statusKey = status || "";
  return (
    <span className={getStatusStyle(statusKey)}>
      {statusKey.replace(/_/g, " ") || "N/A"}
    </span>
  );
};

export default function CrossConnects() {
  const [isClient, setIsClient] = useState(false);
  const [rowData, setRowData] = useState<CrossConnect[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCrossConnectId, setSelectedCrossConnectId] = useState<string | undefined>(undefined);
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const isInternalUser = user?.internal ?? false;
  
  const handleViewCrossConnect = useCallback((id: string) => {
    setSelectedCrossConnectId(id);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedCrossConnectId(undefined);
  }, []);

  useEffect(() => {
    setIsClient(true);
    fetchCrossConnects();
  }, []);

  const fetchCrossConnects = async () => {
    try {
      const response = await getWithAuth(`${API_BASE}/network/cross-connects/v1/`);
      if (response.ok) {
        const data = await response.json();
        setRowData(data);
      }
    } catch (error) {
      console.error("Failed to fetch cross-connects:", error);
    } finally {
      setLoading(false);
    }
  };

  const ActionsCellRenderer = useCallback((params: ICellRendererParams<CrossConnect>) => {
    const data = params.data;
    if (!data) return null;
    const isDraft = data.cross_connect_status === "DRAFT";
    const canEdit = isInternalUser || isDraft;
    return (
      <div className="h-full flex items-center gap-2">
        <Tooltip content="View" delay={1000}>
          <Button isIconOnly size="sm" variant="flat" color="primary" onPress={() => handleViewCrossConnect(data.cross_connect_id)}>
            <EyeIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        {canEdit && (
          <Tooltip content="Edit" delay={1000}>
            <Button isIconOnly size="sm" variant="flat" color="warning" onPress={() => router.push(`/cross-connects/edit?id=${data.cross_connect_id}`)}>
              <PencilSquareIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
        )}
        {isInternalUser && (
          <Tooltip content="Delete" delay={1000}>
            <Button isIconOnly size="sm" variant="flat" color="danger">
              <TrashIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
        )}
      </div>
    );
  }, [router, handleViewCrossConnect, isInternalUser]);

  const gridTheme = resolvedTheme === "dark" ? themeAlpine.withPart(colorSchemeDark) : themeAlpine;

  const columnDefs = useMemo<ColDef<CrossConnect>[]>(() => [
    { headerName: "Actions", cellRenderer: ActionsCellRenderer, width: 150, minWidth: 150, maxWidth: 150, flex: 0, resizable: false, sortable: false, filter: false, cellClass: "pt-1" },
    { field: "cross_connect_id", headerName: "ID", filter: true, sortable: true, width: 150 },
    { field: "cross_connect_status", headerName: "Status", cellRenderer: StatusCellRenderer, filter: true, sortable: true, width: 150 },
    { field: "source_rack_id", headerName: "Source Rack ID", filter: true, sortable: true, width: 150 },
    { field: "source_client_name", headerName: "Source Client", filter: true, sortable: true, width: 180 },
    { field: "target_rack_id", headerName: "Target Rack ID", filter: true, sortable: true, width: 150 },
    { field: "target_client_name", headerName: "Target Client", filter: true, sortable: true, width: 180 },
    { field: "update_time", headerName: "Last Updated", filter: true, sortable: true, sort: "desc", width: 180, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : "" },
  ], [ActionsCellRenderer]);

  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 80,
    resizable: true,
  }), []);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="p-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Cross-Connects</h1>
          <p className="text-gray-500 text-sm">Manage rack-to-rack connections</p>
        </div>
        <Button color="primary" onPress={() => router.push("/cross-connects/create")}>
          Add Cross-Connect
        </Button>
      </div>
      {isClient && (
        <div className="flex-1 overflow-hidden">
          <AgGridReact<CrossConnect>
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
      <CrossConnectDetailDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        crossConnectId={selectedCrossConnectId}
      />
    </div>
  );
}
