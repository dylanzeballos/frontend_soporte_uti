import * as React from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  ChevronDownIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  SendIcon,
  SquareKanbanIcon,
  TicketIcon,
  UserCogIcon,
  UserPlusIcon,
  Building2Icon,
  WrenchIcon,
  BriefcaseBusinessIcon,
  UsersIcon,
} from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import type { UserRole } from "@/features/users/schemas"
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
        title: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboardIcon,
        roles: ["admin", "agent", "user"],
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
    ],
  },
  {
    label: "Administración",
    items: [
      {
        title: "Gestión de tickets",
        to: "/tickets/admin",
        icon: TicketIcon,
        roles: ["admin", "agent"],
      },
      {
        title: "Administración",
        icon: UsersIcon,
        roles: ["admin"],
        children: [
          {
            title: "Administrar usuarios",
            to: "/admin/users",
            roles: ["admin"],
          },
          {
            title: "Registrar usuarios",
            disabled: true,
            roles: ["admin"],
          },
          {
            title: "Modificar unidades",
            disabled: true,
            roles: ["admin"],
          },
          {
            title: "Agregar servicios",
            disabled: true,
            roles: ["admin"],
          },
          {
            title: "Agregar roles o cargos",
            disabled: true,
            roles: ["admin"],
          },
        ],
      },
      {
        title: "Administrar usuarios",
        to: "/admin/users",
        icon: UserCogIcon,
        roles: ["admin"],
      },
      {
        title: "Registrar usuarios",
        icon: UserPlusIcon,
        roles: ["admin"],
        children: [
          { title: "Próximamente", disabled: true, roles: ["admin"] },
        ],
      },
      {
        title: "Modificar unidades",
        icon: Building2Icon,
        roles: ["admin"],
        children: [
          { title: "Próximamente", disabled: true, roles: ["admin"] },
        ],
      },
      {
        title: "Agregar servicios",
        icon: WrenchIcon,
        roles: ["admin"],
        children: [
          { title: "Próximamente", disabled: true, roles: ["admin"] },
        ],
      },
      {
        title: "Agregar roles o cargos",
        icon: BriefcaseBusinessIcon,
        roles: ["admin"],
        children: [
          { title: "Próximamente", disabled: true, roles: ["admin"] },
        ],
      },
    ],
  },
]

function isPathActive(pathname: string, target: string) {
  return pathname === target || pathname.startsWith(`${target}/`)
}

function getPageLabel(pathname: string) {
  if (isPathActive(pathname, "/dashboard")) return "Dashboard"
  if (isPathActive(pathname, "/kanban")) return "Tablero Kanban"
  if (pathname === "/tickets/request") return "Enviar solicitud"
  if (pathname === "/tickets/admin") return "Gestión de tickets"
  if (isPathActive(pathname, "/tickets")) return "Mis solicitudes"
  if (isPathActive(pathname, "/admin/users")) return "Usuarios"
  return "Panel"
}

function AppShell({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { isMobile, open, state, setOpenMobile } = useSidebar()

  const collapsed = state === "collapsed"
  const pathname = location.pathname

  const visibleSections = React.useMemo(() => {
    if (!user) return []

    return navSections
      .map((section) => ({
        ...section,
        items: section.items
          .filter((item) => item.roles.includes(user.role))
          .map((item) => ({
            ...item,
            children: item.children?.filter((child) => child.roles.includes(user.role)),
          }))
          .filter((item) => item.to || item.children?.length),
      }))
      .filter((section) => section.items.length)
  }, [user])

  const activeParents = React.useMemo(() => {
    const next = new Set<string>()

    visibleSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children?.some((child) => (child.to ? isPathActive(pathname, child.to) : false))) {
          next.add(item.title)
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
        aria-label="Navegación principal"
        collapsible="icon"
      >
        <SidebarHeader className="px-3 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground ring-sidebar-ring transition-colors hover:bg-sidebar-accent/90 focus-visible:outline-none focus-visible:ring-2"
              aria-label="Ir al dashboard"
            >
              <img src="/LogoFCE.webp" alt="" className="h-6 w-auto" />
            </button>
            <div className={cn("min-w-0", collapsed && "hidden")}>
              <p className="truncate text-sm font-semibold text-sidebar-foreground">Soporte UTI</p>
              <p className="truncate text-xs text-sidebar-foreground/70">Gestor de tickets</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          {visibleSections.map((section) => (
            <SidebarGroup key={section.label} className="px-1 py-1.5">
              <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-wide text-sidebar-foreground/55">
                {section.label}
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const hasChildren = Boolean(item.children?.length)
                    const sectionOpen =
                      activeParents.has(item.title) || Boolean(expandedSections[item.title])
                    const directActive = item.to ? isPathActive(pathname, item.to) : false
                    const childActive = Boolean(
                      item.children?.some((child) => (child.to ? isPathActive(pathname, child.to) : false))
                    )
                    const active = directActive || childActive

                    return (
                      <SidebarMenuItem key={item.title}>
                        {hasChildren ? (
                          <>
                            <SidebarMenuButton
                              type="button"
                              isActive={active}
                              tooltip={item.title}
                              title={collapsed ? item.title : undefined}
                              aria-expanded={sectionOpen}
                              className={cn(
                                "relative h-10 rounded-md px-2.5 hover:bg-sidebar-accent/90 focus-visible:ring-2",
                                active && "bg-sidebar-accent text-sidebar-accent-foreground",
                                active &&
                                  "after:absolute after:top-1.5 after:left-0 after:h-7 after:w-1 after:rounded-r-full after:bg-sidebar-primary"
                              )}
                              onClick={() =>
                                setExpandedSections((prev) => ({
                                  ...prev,
                                  [item.title]: !sectionOpen,
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
                                    const isActive = child.to ? isPathActive(pathname, child.to) : false
                                    const childDisabled = Boolean(child.disabled)

                                    return (
                                      <SidebarMenuSubItem key={`${item.title}-${child.title}-${index}`}>
                                        {childDisabled || !child.to ? (
                                          <SidebarMenuSubButton
                                            isActive={false}
                                            aria-disabled="true"
                                            className="cursor-not-allowed rounded-md opacity-50"
                                            title="No disponible"
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
                                "relative h-10 rounded-md px-2.5 hover:bg-sidebar-accent/90 focus-visible:ring-2",
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
                              className="h-10 cursor-not-allowed rounded-md px-2.5 opacity-50"
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

        <SidebarFooter className="mt-auto px-3 py-3">
          <div className="flex items-center gap-2">
            {!collapsed && (
              <p className="text-xs text-sidebar-foreground/70">v1.0</p>
            )}
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-svh max-h-svh overflow-hidden">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
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
