// Base audit fields shared by all response types
export interface AuditFields {
  create_time: string;
  creater_id: string;
  creater_name: string;
  update_time: string;
  updater_id: string;
  updater_name: string;
}

// Common interfaces
export interface ClientRef {
  client_id: string;
  client_name: string;
}

export interface ActivityItem {
  id: string;
  username: string;
  activity: string;
  timestamp: string;
  status: string;
}
