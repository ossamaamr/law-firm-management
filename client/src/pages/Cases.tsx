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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Cases() {
  const { language, t } = useLanguage();
  const isRTL = language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    caseNumber: "",
    title: "",
    caseType: "civil" as const,
    courtName: "",
    judge: "",
    oppositeParty: "",
    priority: "medium" as const,
    description: "",
  });

  // Fetch cases list
  const { data: cases, isLoading, refetch } = trpc.cases.list.useQuery({
    status: statusFilter || undefined,
  });

  // Create case mutation
  const createCaseMutation = trpc.cases.create.useMutation({
    onSuccess: () => {
      toast.success(t("caseCreatedSuccessfully"));
      setFormData({
        caseNumber: "",
        title: "",
        caseType: "civil",
        courtName: "",
        judge: "",
        oppositeParty: "",
        priority: "medium",
        description: "",
      });
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || t("errorCreatingCase"));
    },
  });

  const handleCreateCase = async () => {
    if (!formData.caseNumber.trim() || !formData.title.trim()) {
      toast.error(t("caseNumberAndTitleRequired"));
      return;
    }

    createCaseMutation.mutate({
      caseNumber: formData.caseNumber,
      title: formData.title,
      caseType: formData.caseType,
      courtName: formData.courtName || undefined,
      judge: formData.judge || undefined,
      oppositeParty: formData.oppositeParty || undefined,
      priority: formData.priority,
      description: formData.description || undefined,
      clientId: 1, // TODO: Get from user selection
      lawyerId: 1, // TODO: Get from user selection
      matterId: 1, // TODO: Get from user selection
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredCases = (cases || []).filter((caseItem) =>
    caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseItem.caseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`space-y-6 ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("cases")}</h1>
          <p className="text-muted-foreground mt-1">{t("manageYourCases")}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t("addNewCase")}
            </Button>
          </DialogTrigger>
          <DialogContent className={isRTL ? "rtl" : "ltr"} dir={isRTL ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>{t("addNewCase")}</DialogTitle>
              <DialogDescription>{t("fillInTheCaseDetails")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="text-sm font-medium">{t("caseNumber")}</label>
                <Input
                  placeholder={t("enterCaseNumber")}
                  value={formData.caseNumber}
                  onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("title")}</label>
                <Input
                  placeholder={t("enterCaseTitle")}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("caseType")}</label>
                <Select
                  value={formData.caseType}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, caseType: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="civil">{t("civil")}</SelectItem>
                    <SelectItem value="criminal">{t("criminal")}</SelectItem>
                    <SelectItem value="commercial">{t("commercial")}</SelectItem>
                    <SelectItem value="family">{t("family")}</SelectItem>
                    <SelectItem value="administrative">{t("administrative")}</SelectItem>
                    <SelectItem value="labor">{t("labor")}</SelectItem>
                    <SelectItem value="other">{t("other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{t("priority")}</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("low")}</SelectItem>
                    <SelectItem value="medium">{t("medium")}</SelectItem>
                    <SelectItem value="high">{t("high")}</SelectItem>
                    <SelectItem value="urgent">{t("urgent")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{t("courtName")}</label>
                <Input
                  placeholder={t("enterCourtName")}
                  value={formData.courtName}
                  onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("judge")}</label>
                <Input
                  placeholder={t("enterJudgeName")}
                  value={formData.judge}
                  onChange={(e) => setFormData({ ...formData, judge: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("oppositeParty")}</label>
                <Input
                  placeholder={t("enterOppositeParty")}
                  value={formData.oppositeParty}
                  onChange={(e) => setFormData({ ...formData, oppositeParty: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("description")}</label>
                <Input
                  placeholder={t("enterDescription")}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  onClick={handleCreateCase}
                  disabled={createCaseMutation.isPending}
                >
                  {createCaseMutation.isPending ? t("creating") : t("create")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("searchCases")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("allStatuses")}</SelectItem>
            <SelectItem value="open">{t("open")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
            <SelectItem value="closed">{t("closed")}</SelectItem>
            <SelectItem value="archived">{t("archived")}</SelectItem>
            <SelectItem value="suspended">{t("suspended")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("casesList")}</CardTitle>
          <CardDescription>
            {filteredCases.length} {t("cases")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("noCasesFound")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("caseNumber")}</TableHead>
                    <TableHead>{t("title")}</TableHead>
                    <TableHead>{t("type")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("priority")}</TableHead>
                    <TableHead>{t("court")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell className="font-medium">{caseItem.caseNumber}</TableCell>
                      <TableCell>{caseItem.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t(caseItem.caseType)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(caseItem.status)}>
                          {t(caseItem.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(caseItem.priority)}>
                          {t(caseItem.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {caseItem.courtName ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {caseItem.courtName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
