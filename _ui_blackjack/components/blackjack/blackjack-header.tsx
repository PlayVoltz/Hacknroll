import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"

export function BlackjackHeader() {
  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/originals">Originals</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Blackjack</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">Blackjack</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-elevated text-muted-foreground border border-border">
            Virtual credits only
          </Badge>
          <Badge variant="secondary" className="bg-elevated text-muted-foreground border border-border">
            18+
          </Badge>
          <Badge variant="secondary" className="bg-elevated text-primary border border-primary/30">
            Provably-fair UI
          </Badge>
        </div>
      </div>
    </div>
  )
}
