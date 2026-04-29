import * as React from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  BriefcaseBusinessIcon,
  Building2Icon,
  ChevronDownIcon,
  FileTextIcon,
  HouseIcon,
  InboxIcon,
  LayoutDashboardIcon,
  SendIcon,
  SquareKanbanIcon,
  TicketIcon,
  UserCogIcon,
  WrenchIcon,
} from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { UserNav } from "@/components/user-nav"
import { getAppUserRole, getDefaultRouteForUser, type UserRole } from "@/features/users/schemas"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

type NavLeaf = {
  title: string
  to?: string
  disabled?: boolean
  statusAware?: boolean
  roles: UserRole[]
}

type NavNode = {
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  roles: UserRole[]
  to?: string
  children?: NavLeaf[]
}

type NavSection = {
  label: string
  items: NavNode[]
}

const navSections: NavSection[] = [
  {
    label: "General",
    items: [
      {
        title: "Inicio",
        to: "/dashboard",
        icon: HouseIcon,
        roles: ["user"],
      },
      {
        title: "Enviar solicitud",
        to: "/tickets/request",
        icon: SendIcon,
        roles: ["user"],
      },
      {
        title: "Mis solicitudes",
        to: "/tickets",
        icon: FileTextIcon,
        roles: ["user"],
      },
      {
        title: "Tablero Kanban",
        to: "/kanban",
        icon: SquareKanbanIcon,
        roles: ["admin", "agent"],
      },
      {
        title: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboardIcon,
        roles: ["admin"],
      },
    ],
  },
  {
    label: "Tecnico",
    items: [
      {
        title: "Dashboard",
        to: "/technician/dashboard",
        icon: LayoutDashboardIcon,
        roles: ["agent"],
      },
      {
        title: "Kanban",
        to: "/technician/kanban",
        icon: SquareKanbanIcon,
        roles: ["agent"],
      },
      {
        title: "Mis asignaciones",
        to: "/technician/assignments",
        icon: TicketIcon,
        roles: ["agent"],
      },
      {
        title: "Tickets pendientes",
        to: "/technician/pending",
        icon: InboxIcon,
        roles: ["agent"],
      },
      {
        title: "Mis reportes",
        to: "/technician/reports",
        icon: FileTextIcon,
        roles: ["agent"],
      },
    ],
  },
  {
    label: "Administracion",
    items: [
      {
        title: "Gestion de tickets",
        to: "/tickets",
        icon: TicketIcon,
        roles: ["admin"],
      },
      {
        title: "Modificar unidades",
        to: "/admin/units",
        icon: Building2Icon,
        roles: ["admin"],
      },
      {
        title: "Agregar servicios",
        to: "/admin/services",
        icon: WrenchIcon,
        roles: ["admin"],
      },
      {
        title: "Agregar roles o cargos",
        to: "/admin/roles",
        icon: BriefcaseBusinessIcon,
        roles: ["admin"],
      },
      {
        title: "Administrar usuarios",
        to: "/admin/users",
        icon: UserCogIcon,
        roles: ["admin"],
      },
      {
        title: "Reportes tecnicos",
        to: "/admin/reports",
        icon: FileTextIcon,
        roles: ["admin"],
      },
    ],
  },
]

function isPathActive(pathname: string, target: string) {
  return pathname === target || pathname.startsWith(`${target}/`)
}

function getPageLabel(pathname: string) {
  if (isPathActive(pathname, "/")) return "Inicio"
  if (isPathActive(pathname, "/dashboard")) return "Dashboard"
  if (isPathActive(pathname, "/kanban")) return "Tablero Kanban"
  if (isPathActive(pathname, "/technician/dashboard")) return "Dashboard tecnico"
  if (isPathActive(pathname, "/technician/kanban")) return "Kanban tecnico"
  if (isPathActive(pathname, "/technician/assignments")) return "Mis asignaciones"
  if (isPathActive(pathname, "/technician/pending")) return "Tickets pendientes"
  if (isPathActive(pathname, "/technician/reports")) return "Mis reportes"
  if (isPathActive(pathname, "/tickets")) return "Tickets"
  if (isPathActive(pathname, "/admin/users")) return "Usuarios"
  if (isPathActive(pathname, "/admin/reports")) return "Reportes tecnicos"
  if (isPathActive(pathname, "/admin/units")) return "Unidades"
  if (isPathActive(pathname, "/admin/services")) return "Servicios"
  if (isPathActive(pathname, "/admin/roles")) return "Roles o cargos"
  return "Panel"
}

function isPendingStatus(rawStatus: string | null | undefined) {
  if (!rawStatus) return false
  const value = rawStatus.toLowerCase()
  return value === "pendiente" || value === "pending"
}

function AppShell({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { isMobile, open, state, setOpenMobile } = useSidebar()

  const collapsed = state === "collapsed"
  const pathname = location.pathname
  const search = new URLSearchParams(location.search)
  const ticketStatusFromQuery = search.get("status")
  const ticketStatusFromState =
    typeof (location.state as { ticketStatus?: string } | null)?.ticketStatus === "string"
      ? (location.state as { ticketStatus?: string }).ticketStatus
      : null
  const canMutateRequest = isPendingStatus(ticketStatusFromQuery ?? ticketStatusFromState)

  const visibleSections = React.useMemo(() => {
    if (!user) return []
    const appRole = getAppUserRole(user)

    return navSections
      .map((section) => ({
        ...section,
        items: section.items
          .filter((item) => item.roles.includes(appRole))
          .map((item) => ({
            ...item,
            children: item.children?.filter((child) => child.roles.includes(appRole)),
          }))
          .filter((item) => item.to || item.children?.length),
      }))
      .filter((section) => section.items.length)
  }, [user])

  const activeParents = React.useMemo(() => {
    const next = new Set<string>()

    visibleSections.forEach((section) => {
      section.items.forEach((item, itemIndex) => {
        const itemKey = `${section.label}-${itemIndex}-${item.title}`
        if (item.children?.some((child) => (child.to ? isPathActive(pathname, child.to) : false))) {
          next.add(itemKey)
        }
      })
    })

    return next
  }, [pathname, visibleSections])

  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, pathname, setOpenMobile])

  const onNavigate = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, setOpenMobile])

  return (
    <>
      <a
        href="#main-content"
        className="skip-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Saltar al contenido
      </a>

      <Sidebar
        role="navigation"
        aria-label="Navegacion principal"
        collapsible="icon"
      >
        <SidebarHeader className="border-b border-sidebar-border/60 px-3 py-4 group-data-[collapsible=icon]:px-1.5">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <button
              type="button"
              onClick={() => navigate(getDefaultRouteForUser(user))}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground ring-sidebar-ring transition-colors hover:bg-sidebar-accent/90 focus-visible:outline-none focus-visible:ring-2 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8"
              aria-label="Ir al dashboard"
            >
              <img
                src={collapsed ? "/LogoFCE_reduced.webp" : "/LogoFCE.webp"}
                alt=""
                className={cn("w-auto", collapsed ? "h-5" : "h-6")}
              />
            </button>
            <div className={cn("min-w-0", collapsed && "hidden")}>
              <p className="truncate text-sm font-semibold text-sidebar-foreground">Soporte UTI</p>
              <p className="truncate text-xs text-sidebar-foreground/70">Gestor de tickets</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4 group-data-[collapsible=icon]:px-1.5">
          {visibleSections.map((section) => (
            <SidebarGroup key={section.label} className="px-1 py-2">
              <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-wide text-sidebar-foreground/55">
                {section.label}
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon
                    const itemKey = `${section.label}-${itemIndex}-${item.title}`
                    const hasChildren = Boolean(item.children?.length)
                    const sectionOpen =
                      activeParents.has(itemKey) || Boolean(expandedSections[itemKey])
                    const directActive = item.to ? isPathActive(pathname, item.to) : false
                    const childActive = Boolean(
                      item.children?.some((child) => (child.to ? isPathActive(pathname, child.to) : false))
                    )
                    const active = directActive || childActive

                    return (
                      <SidebarMenuItem key={itemKey}>
                        {hasChildren ? (
                          <>
                            <SidebarMenuButton
                              type="button"
                              isActive={active}
                              tooltip={item.title}
                              title={collapsed ? item.title : undefined}
                              aria-expanded={sectionOpen}
                              className={cn(
                                "relative h-11 rounded-lg px-2.5 hover:bg-sidebar-accent/90 focus-visible:ring-2",
                                active && "bg-sidebar-accent text-sidebar-accent-foreground",
                                active &&
                                  "after:absolute after:top-1.5 after:left-0 after:h-7 after:w-1 after:rounded-r-full after:bg-sidebar-primary"
                              )}
                              onClick={() =>
                                setExpandedSections((prev) => ({
                                  ...prev,
                                  [itemKey]: !sectionOpen,
                                }))
                              }
                            >
                              <Icon />
                              <span>{item.title}</span>
                              <ChevronDownIcon
                                className={cn(
                                  "ml-auto h-4 w-4 shrink-0 transition-transform duration-200",
                                  sectionOpen && "rotate-180"
                                )}
                                aria-hidden="true"
                              />
                            </SidebarMenuButton>

                            <div
                              className={cn(
                                "grid transition-all duration-200 ease-out",
                                sectionOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                              )}
                            >
                              <div className="overflow-hidden">
                                <SidebarMenuSub>
                                  {item.children?.map((child, index) => {
                                    const isActive = child.to
                                      ? pathname === child.to || pathname === `${child.to}/`
                                      : false
                                    const childDisabled =
                                      Boolean(child.disabled) ||
                                      (Boolean(child.statusAware) && !canMutateRequest)

                                    return (
                                      <SidebarMenuSubItem key={`${item.title}-${child.title}-${index}`}>
                                        {childDisabled || !child.to ? (
                                          <SidebarMenuSubButton
                                            isActive={false}
                                            aria-disabled="true"
                                            className="cursor-not-allowed rounded-md opacity-50"
                                            title={
                                              child.statusAware
                                                ? "Disponible solo para solicitudes pendientes"
                                                : "No disponible"
                                            }
                                          >
                                            <span>{child.title}</span>
                                          </SidebarMenuSubButton>
                                        ) : (
                                          <SidebarMenuSubButton
                                            render={<NavLink to={child.to} end />}
                                            isActive={isActive}
                                            aria-current={isActive ? "page" : undefined}
                                            onClick={onNavigate}
                                            className={cn(
                                              "rounded-md focus-visible:ring-2",
                                              isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                                            )}
                                          >
                                            <span>{child.title}</span>
                                          </SidebarMenuSubButton>
                                        )}
                                      </SidebarMenuSubItem>
                                    )
                                  })}
                                </SidebarMenuSub>
                              </div>
                            </div>
                          </>
                        ) : (
                          item.to ? (
                            <SidebarMenuButton
                              render={<NavLink to={item.to} end />}
                              isActive={active}
                              tooltip={item.title}
                              title={collapsed ? item.title : undefined}
                              aria-current={active ? "page" : undefined}
                              onClick={onNavigate}
                              className={cn(
                                "relative h-11 rounded-lg px-2.5 hover:bg-sidebar-accent/90 focus-visible:ring-2",
                                active && "bg-sidebar-accent text-sidebar-accent-foreground",
                                active &&
                                  "after:absolute after:top-1.5 after:left-0 after:h-7 after:w-1 after:rounded-r-full after:bg-sidebar-primary"
                              )}
                            >
                              <Icon />
                              <span>{item.title}</span>
                            </SidebarMenuButton>
                          ) : (
                            <SidebarMenuButton
                              type="button"
                              isActive={false}
                              tooltip={item.title}
                              aria-disabled="true"
                              title={collapsed ? `${item.title} (no disponible)` : undefined}
                              className="h-11 cursor-not-allowed rounded-lg px-2.5 opacity-50"
                            >
                              <Icon />
                              <span>{item.title}</span>
                            </SidebarMenuButton>
                          )
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="mt-auto border-t border-sidebar-border/60 px-3 py-4 group-data-[collapsible=icon]:px-1.5">
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <ModeToggle />
            {!collapsed && <span className="text-xs text-sidebar-foreground/70">Tema</span>}
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-svh max-h-svh overflow-hidden">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/70">
          <div className="shell-header flex items-center justify-between gap-3 px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger
                className="focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={open ? "Colapsar barra lateral" : "Expandir barra lateral"}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {getPageLabel(pathname)}
                </p>
                <p className="truncate text-xs text-muted-foreground">Gestor Soporte UTI</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationCenter />
              <ModeToggle />
              <UserNav />
            </div>
          </div>
        </header>

        <main id="main-content" className="shell-content flex-1 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </>
  )
}

export function AppSidebar({ children }: { children?: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppShell>{children}</AppShell>
    </SidebarProvider>
  )
}
