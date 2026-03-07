import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Mail, Phone, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Clients() {
  const { language, t } = useLanguage();
  const isRTL = language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    nationalId: "",
    clientType: "individual" as const,
  });

  // Fetch clients list
  const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery();

  // Filter clients on the client side
  const filteredClients = (clients || []).filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create client mutation
  const createClientMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success(t("clientCreatedSuccessfully"));
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        nationalId: "",
        clientType: "individual",
      });
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || t("errorCreatingClient"));
    },
  });

  const handleCreateClient = async () => {
    if (!formData.name.trim()) {
      toast.error(t("clientNameRequired"));
      return;
    }

    createClientMutation.mutate({
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      nationalId: formData.nationalId || undefined,
      clientType: formData.clientType,
    });
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getConflictStatusColor = (status: string) => {
    switch (status) {
      case "conflict":
        return "bg-red-100 text-red-800";
      case "clear":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`space-y-6 ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("clients")}</h1>
          <p className="text-muted-foreground mt-1">{t("manageYourClients")}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t("addNewClient")}
            </Button>
          </DialogTrigger>
          <DialogContent className={isRTL ? "rtl" : "ltr"} dir={isRTL ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>{t("addNewClient")}</DialogTitle>
              <DialogDescription>{t("fillInTheClientDetails")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("clientName")}</label>
                <Input
                  placeholder={t("enterClientName")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("email")}</label>
                <Input
                  type="email"
                  placeholder={t("enterEmail")}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("phone")}</label>
                <Input
                  placeholder={t("enterPhone")}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("address")}</label>
                <Input
                  placeholder={t("enterAddress")}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("city")}</label>
                <Input
                  placeholder={t("enterCity")}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleCreateClient}
                  disabled={createClientMutation.isPending}
                >
                  {createClientMutation.isPending ? t("creating") : t("create")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("searchClients")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("clientsList")}</CardTitle>
          <CardDescription>
            {filteredClients?.length || 0} {t("clients")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("noClientsFound")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("phone")}</TableHead>
                    <TableHead>{t("type")}</TableHead>
                    <TableHead>{t("kycStatus")}</TableHead>
                    <TableHead>{t("conflictCheck")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        {client.email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {client.email}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {client.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {client.clientType === "individual"
                            ? t("individual")
                            : t("company")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getKYCStatusColor(client.kycStatus)}>
                          {t(client.kycStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getConflictStatusColor(client.conflictCheckStatus)}>
                          {t(client.conflictCheckStatus)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
