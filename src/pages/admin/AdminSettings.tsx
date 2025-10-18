import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { format } from "date-fns";

export default function AuditLog() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["audit-logs", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (searchTerm) {
        query = query.or(`action_type.ilike.%${searchTerm}%,action_description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getActionBadgeVariant = (actionType: string) => {
    if (actionType.includes("delete")) return "destructive";
    if (actionType.includes("create") || actionType.includes("insert")) return "default";
    if (actionType.includes("update")) return "secondary";
    return "outline";
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">Track all administrative actions</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit logs by action type or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin User</TableHead>
                  <TableHead>Action Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Table</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : auditLogs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No audit logs found</TableCell>
                  </TableRow>
                ) : (
                  auditLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{log.admin_user_id.slice(0, 8)}...</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action_type)}>
                          {log.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.action_description}</TableCell>
                      <TableCell>
                        {log.affected_table ? (
                          <Badge variant="outline">{log.affected_table}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
