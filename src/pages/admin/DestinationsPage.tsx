import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Upload } from "lucide-react";

const TOP_50_DESTINATIONS = [
  { city: "London", country: "United Kingdom", code: "LHR" },
  { city: "Paris", country: "France", code: "CDG" },
  { city: "Tokyo", country: "Japan", code: "NRT" },
  { city: "Barcelona", country: "Spain", code: "BCN" },
  { city: "Amsterdam", country: "Netherlands", code: "AMS" },
  { city: "Rome", country: "Italy", code: "FCO" },
  { city: "Dubai", country: "UAE", code: "DXB" },
  { city: "Cancún", country: "Mexico", code: "CUN" },
  { city: "Punta Cana", country: "Dominican Republic", code: "PUJ" },
  { city: "San José", country: "Costa Rica", code: "SJO" },
  { city: "Mexico City", country: "Mexico", code: "MEX" },
  { city: "Montego Bay", country: "Jamaica", code: "MBJ" },
  { city: "Nassau", country: "Bahamas", code: "NAS" },
  { city: "Aruba", country: "Aruba", code: "AUA" },
  { city: "Grand Cayman", country: "Cayman Islands", code: "GCM" },
  { city: "Madrid", country: "Spain", code: "MAD" },
  { city: "Frankfurt", country: "Germany", code: "FRA" },
  { city: "Munich", country: "Germany", code: "MUC" },
  { city: "Lisbon", country: "Portugal", code: "LIS" },
  { city: "Athens", country: "Greece", code: "ATH" },
  { city: "Istanbul", country: "Turkey", code: "IST" },
  { city: "Tel Aviv", country: "Israel", code: "TLV" },
  { city: "Dublin", country: "Ireland", code: "DUB" },
  { city: "Reykjavik", country: "Iceland", code: "KEF" },
  { city: "Copenhagen", country: "Denmark", code: "CPH" },
  { city: "Stockholm", country: "Sweden", code: "ARN" },
  { city: "Oslo", country: "Norway", code: "OSL" },
  { city: "Zurich", country: "Switzerland", code: "ZRH" },
  { city: "Vienna", country: "Austria", code: "VIE" },
  { city: "Prague", country: "Czech Republic", code: "PRG" },
  { city: "Budapest", country: "Hungary", code: "BUD" },
  { city: "Warsaw", country: "Poland", code: "WAW" },
  { city: "Seoul", country: "South Korea", code: "ICN" },
  { city: "Hong Kong", country: "Hong Kong", code: "HKG" },
  { city: "Singapore", country: "Singapore", code: "SIN" },
  { city: "Bangkok", country: "Thailand", code: "BKK" },
  { city: "Bali", country: "Indonesia", code: "DPS" },
  { city: "Sydney", country: "Australia", code: "SYD" },
  { city: "Auckland", country: "New Zealand", code: "AKL" },
  { city: "São Paulo", country: "Brazil", code: "GRU" },
  { city: "Buenos Aires", country: "Argentina", code: "EZE" },
  { city: "Lima", country: "Peru", code: "LIM" },
  { city: "Bogotá", country: "Colombia", code: "BOG" },
  { city: "Santiago", country: "Chile", code: "SCL" },
  { city: "Cape Town", country: "South Africa", code: "CPT" },
  { city: "Marrakech", country: "Morocco", code: "RAK" },
  { city: "Cairo", country: "Egypt", code: "CAI" },
  { city: "Johannesburg", country: "South Africa", code: "JNB" },
  { city: "Nairobi", country: "Kenya", code: "NBO" },
  { city: "Mauritius", country: "Mauritius", code: "MRU" },
];

export default function DestinationsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDest, setEditingDest] = useState<any>(null);
  const [formData, setFormData] = useState({
    city_name: "",
    country: "",
    airport_code: "",
    priority: "1",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: destinations, isLoading } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .order("priority");
      if (error) throw error;
      return data;
    },
  });

  const createDestination = useMutation({
    mutationFn: async (newDest: typeof formData) => {
      const { error } = await supabase.from("destinations").insert([{
        ...newDest,
        priority: parseInt(newDest.priority),
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      toast({ title: "Success", description: "Destination created" });
      resetForm();
    },
  });

  const updateDestination = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("destinations")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      toast({ title: "Success", description: "Destination updated" });
    },
  });

  const deleteDestination = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("destinations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      toast({ title: "Success", description: "Destination deleted" });
    },
  });

  const bulkImport = useMutation({
    mutationFn: async () => {
      const existing = destinations?.map(d => d.airport_code) || [];
      const toImport = TOP_50_DESTINATIONS.filter(
        d => !existing.includes(d.code)
      ).map((d, index) => ({
        city_name: d.city,
        country: d.country,
        airport_code: d.code,
        priority: existing.length + index + 1,
      }));

      if (toImport.length === 0) {
        throw new Error("All destinations already exist");
      }

      const { error } = await supabase.from("destinations").insert(toImport);
      if (error) throw error;
      return toImport.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      toast({ 
        title: "Success", 
        description: `Imported ${count} new destinations` 
      });
    },
  });

  const resetForm = () => {
    setFormData({
      city_name: "",
      country: "",
      airport_code: "",
      priority: "1",
    });
    setEditingDest(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDest) {
      updateDestination.mutate({
        id: editingDest.id,
        data: {
          city_name: formData.city_name,
          country: formData.country,
          airport_code: formData.airport_code,
          priority: parseInt(formData.priority),
        },
      });
    } else {
      createDestination.mutate(formData);
    }
  };

  const startEdit = (dest: any) => {
    setEditingDest(dest);
    setFormData({
      city_name: dest.city_name,
      country: dest.country,
      airport_code: dest.airport_code,
      priority: dest.priority.toString(),
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Destinations Management</h1>
        <p className="text-muted-foreground">Manage flight destinations from Memphis</p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-4 mb-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Destination
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDest ? "Edit Destination" : "Add New Destination"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>City Name</Label>
                <Input
                  value={formData.city_name}
                  onChange={(e) => setFormData({ ...formData, city_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Airport Code</Label>
                <Input
                  value={formData.airport_code}
                  onChange={(e) => setFormData({ ...formData, airport_code: e.target.value.toUpperCase() })}
                  maxLength={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingDest ? "Update" : "Create"} Destination
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Button
          onClick={() => bulkImport.mutate()}
          variant="outline"
          disabled={bulkImport.isPending}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Top 50 Destinations
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-4 text-sm text-muted-foreground">
        Total: {destinations?.length || 0} destinations
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>City</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Airport Code</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : destinations?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No destinations found. Click "Import Top 50 Destinations" to get started!
                </TableCell>
              </TableRow>
            ) : (
              destinations?.map((dest) => (
                <TableRow key={dest.id}>
                  <TableCell className="font-medium">{dest.city_name}</TableCell>
                  <TableCell>{dest.country}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{dest.airport_code}</Badge>
                  </TableCell>
                  <TableCell>{dest.priority}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={dest.is_active}
                        onCheckedChange={(checked) => {
                          updateDestination.mutate({
                            id: dest.id,
                            data: { is_active: checked },
                          });
                        }}
                      />
                      <span className="text-sm">
                        {dest.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(dest)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Delete this destination?")) {
                            deleteDestination.mutate(dest.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
