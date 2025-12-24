import { Layout } from "@/components/Layout";
import { detentionProcedure, arrestProcedure, forceStages, mirandaRights, timeLimits, detentionSubjects, immunePersons, bailTable, detentionGrounds, licenseTypes, bailInfo } from "@/data/procedures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Shield, Clock, Users, DollarSign, AlertTriangle, Key, Scale } from "lucide-react";

export default function Procedures() {
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Процедуры для госслужащих</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Процедура задержания
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                {detentionProcedure.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Основания для задержания
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                {detentionGrounds.map((ground, i) => <li key={i}>{ground}</li>)}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                Процедура ареста
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                {arrestProcedure.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-green-500" />
                Типы лицензий
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {licenseTypes.map((license) => (
                  <div key={license.code} className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-mono shrink-0 w-20 justify-center">
                      {license.code}
                    </Badge>
                    <span className="text-sm">{license.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-500" />
                Правило Миранды
              </CardTitle>
            </CardHeader>
            <CardContent>
              <blockquote className="border-l-4 border-accent pl-4 italic text-lg">{mirandaRights}</blockquote>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Стадии применения силы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forceStages.map((stage) => (
                  <div key={stage.level} className="flex gap-3">
                    <Badge variant="outline" className="shrink-0">{stage.level}</Badge>
                    <div>
                      <p className="font-medium">{stage.name}</p>
                      <p className="text-sm text-muted-foreground">{stage.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Временные ограничения
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Действие</TableHead><TableHead>Время</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {timeLimits.map((item) => (
                    <TableRow key={item.action}><TableCell>{item.action}</TableCell><TableCell>{item.time}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">
                Вызов Адвоката 3 мин. на ответ, 10 на прибытие. Вызов Прокурора и Начальство не более 15 мин. если прок ответил, то до его прибытия.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Таблица залогов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Розыск</TableHead><TableHead>Сумма</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {bailTable.map((item) => (
                    <TableRow key={item.stars}><TableCell>{"⭐".repeat(item.stars)}</TableCell><TableCell className="font-semibold">{item.amount}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                <p>{bailInfo.description}</p>
                <p className="text-muted-foreground">{bailInfo.courtNote}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Субъекты задержания
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1">
                {detentionSubjects.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-600" />
                Неприкосновенные лица
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1">
                {immunePersons.map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
