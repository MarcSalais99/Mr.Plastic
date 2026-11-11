"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  price: number | string;
  isActive: boolean;
};

type Branch = {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean;
};

type InventoryItem = {
  id: string;
  quantity: number;
  updatedAt: string;
  branch: Branch;
  product: Product;
};

type Movement = {
  id: string;
  movementType: "ENTRY" | "EXIT";
  quantity: number;
  referenceType: string | null;
  createdAt: string;
  branch: Branch;
  product: Product;
};

type User = {
  id?: string;
  sub?: string;
  name?: string;
  email: string;
  role: string;
  branchId: string | null;
};

type Section = "overview" | "products" | "inventory" | "movements" | "branches";
type ModalMode = "product" | "branch" | "stock" | "movement" | "login";

const API_BASE = "/api/backend";
const EMPTY_MESSAGE = "Aún no hay registros para mostrar.";

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = window.localStorage.getItem("plastics-pos-token");
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const body = payload as { message?: string | string[] };
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;
    throw new Error(message || `Error del servidor (${response.status})`);
  }
  return payload as T;
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Icon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "grid":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
    case "box":
      return <svg {...common}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" /></svg>;
    case "layers":
      return <svg {...common}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></svg>;
    case "arrows":
      return <svg {...common}><path d="M7 7h13l-3-3M17 17H4l3 3" /><path d="M20 7a8 8 0 0 1-2.4 5.7M4 17a8 8 0 0 1 2.4-5.7" /></svg>;
    case "store":
      return <svg {...common}><path d="M3 10V6l2-3h14l2 3v4" /><path d="M4 10v11h16V10M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M9 21v-6h6v6" /></svg>;
    case "search":
      return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
    case "bell":
      return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "chevron":
      return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
    case "down":
      return <svg {...common}><path d="m7 10 5 5 5-5" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
    case "cart":
      return <svg {...common}><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>;
    case "trend":
      return <svg {...common}><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></svg>;
    case "warning":
      return <svg {...common}><path d="m10.3 4.3-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.7l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>;
    case "more":
      return <svg {...common}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>;
    case "refresh":
      return <svg {...common}><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" /></svg>;
    case "close":
      return <svg {...common}><path d="m18 6-12 12M6 6l12 12" /></svg>;
    case "logout":
      return <svg {...common}><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
  }
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div>
            <h2 id="modal-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}><Icon name="close" /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function ActionModal({
  mode,
  branches,
  products,
  selectedBranchId,
  onClose,
  onSaved,
  onLogin,
}: {
  mode: ModalMode;
  branches: Branch[];
  products: Product[];
  selectedBranchId: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onLogin: (token: string, user: User) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const copy = {
    product: ["Agregar producto", "Completa los datos para sumar un producto al catálogo."],
    branch: ["Agregar sucursal", "Crea una nueva ubicación para gestionar existencias."],
    stock: ["Registrar existencias", "Inicializa el inventario de un producto en una sucursal."],
    movement: ["Nuevo movimiento", "Registra una entrada o salida de inventario."],
    login: ["Bienvenido de vuelta", "Inicia sesión con las credenciales de tu equipo."],
  }[mode];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "").trim();

    try {
      if (mode === "product") {
        await apiRequest<Product>("/products", {
          method: "POST",
          body: JSON.stringify({
            sku: value("sku"),
            name: value("name"),
            description: value("description") || null,
            unit: value("unit") || "pieza",
            price: Number(value("price")),
          }),
        });
      } else if (mode === "branch") {
        await apiRequest<Branch>("/branches", {
          method: "POST",
          body: JSON.stringify({
            name: value("name"),
            address: value("address") || null,
          }),
        });
      } else if (mode === "stock") {
        await apiRequest<InventoryItem>("/branch-inventory", {
          method: "POST",
          body: JSON.stringify({
            branchId: value("branchId"),
            productId: value("productId"),
            quantity: Number(value("quantity")),
          }),
        });
      } else if (mode === "movement") {
        await apiRequest<Movement>("/inventory-movements", {
          method: "POST",
          body: JSON.stringify({
            branchId: value("branchId"),
            productId: value("productId"),
            movementType: value("movementType"),
            quantity: Number(value("quantity")),
            referenceType: value("referenceType") || "manual",
          }),
        });
      } else {
        const result = await apiRequest<{ access_token: string; user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: value("email"),
            password: String(data.get("password") ?? ""),
          }),
        });
        onLogin(result.access_token, result.user);
      }

      await onSaved();
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo completar la solicitud.");
    } finally {
      setBusy(false);
    }
  }

  const needsBranchAndProduct = mode === "stock" || mode === "movement";
  const needsCatalog = needsBranchAndProduct;

  return (
    <ModalShell title={copy[0]} subtitle={copy[1]} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        {mode === "product" && <>
          <label className="field"><span>Nombre del producto</span><input name="name" required minLength={2} maxLength={150} placeholder="Ej. Bolsa camiseta mediana" autoFocus /></label>
          <div className="form-grid">
            <label className="field"><span>SKU</span><input name="sku" required maxLength={50} placeholder="BOL-MED-001" /></label>
            <label className="field"><span>Unidad</span><input name="unit" maxLength={30} defaultValue="pieza" /></label>
          </div>
          <div className="form-grid">
            <label className="field"><span>Precio de venta</span><div className="input-prefix"><span>$</span><input name="price" type="number" min="0" step="0.01" required placeholder="0.00" /></div></label>
            <label className="field"><span>Descripción <small>Opcional</small></span><input name="description" placeholder="Detalles del producto" /></label>
          </div>
        </>}
        {mode === "branch" && <>
          <label className="field"><span>Nombre de la sucursal</span><input name="name" required minLength={2} maxLength={100} placeholder="Ej. Centro" autoFocus /></label>
          <label className="field"><span>Dirección <small>Opcional</small></span><input name="address" maxLength={255} placeholder="Calle, colonia, ciudad" /></label>
        </>}
        {needsCatalog && <>
          <label className="field"><span>Producto</span>
            <select name="productId" required defaultValue="">
              <option value="" disabled>Selecciona un producto</option>
              {products.filter((product) => product.isActive).map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}
            </select>
          </label>
          <label className="field"><span>Sucursal</span>
            <select name="branchId" required defaultValue={selectedBranchId || ""}>
              <option value="" disabled>Selecciona una sucursal</option>
              {branches.filter((branch) => branch.isActive).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </label>
        </>}
        {mode === "stock" && <label className="field"><span>Cantidad inicial</span><input name="quantity" type="number" min="0" step="1" required placeholder="0" /></label>}
        {mode === "movement" && <>
          <div className="form-grid">
            <label className="field"><span>Tipo de movimiento</span><select name="movementType"><option value="ENTRY">Entrada</option><option value="EXIT">Salida</option></select></label>
            <label className="field"><span>Cantidad</span><input name="quantity" type="number" min="1" step="1" required placeholder="1" /></label>
          </div>
          <label className="field"><span>Referencia <small>Opcional</small></span><input name="referenceType" maxLength={50} placeholder="Compra, ajuste, merma..." /></label>
        </>}
        {mode === "login" && <>
          <label className="field"><span>Correo electrónico</span><input name="email" type="email" autoComplete="email" required placeholder="tu@empresa.com" autoFocus /></label>
          <label className="field"><span>Contraseña</span><input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" /></label>
        </>}
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="button button-quiet" onClick={onClose}>Cancelar</button>
          <button type="submit" className="button button-primary" disabled={busy || (needsCatalog && (products.length === 0 || branches.length === 0))}>
            {busy ? "Guardando..." : mode === "login" ? "Iniciar sesión" : "Guardar"}
          </button>
        </div>
        {needsCatalog && (products.length === 0 || branches.length === 0) && (
          <p className="form-hint">Primero necesitas al menos un producto y una sucursal para continuar.</p>
        )}
      </form>
    </ModalShell>
  );
}

const sectionInfo: Record<Section, { label: string; title: string; description: string }> = {
  overview: { label: "Resumen", title: "Resumen general", description: "Así se mueve tu operación hoy." },
  products: { label: "Productos", title: "Catálogo de productos", description: "Administra precios y detalles de tus productos." },
  inventory: { label: "Inventario", title: "Inventario por sucursal", description: "Consulta existencias y valor de tu inventario." },
  movements: { label: "Movimientos", title: "Movimientos de inventario", description: "Entradas y salidas registradas recientemente." },
  branches: { label: "Sucursales", title: "Tus sucursales", description: "Gestiona las ubicaciones de tu negocio." },
};

const menu: { section: Section; icon: string }[] = [
  { section: "overview", icon: "grid" },
  { section: "products", icon: "box" },
  { section: "inventory", icon: "layers" },
  { section: "movements", icon: "arrows" },
  { section: "branches", icon: "store" },
];

export default function PosApp() {
  const [section, setSection] = useState<Section>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [modal, setModal] = useState<ModalMode | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState("");
  const [today, setToday] = useState<Date | null>(null);

  const refreshData = useCallback(async () => {
    const results = await Promise.allSettled([
      apiRequest<Product[]>("/products"),
      apiRequest<Branch[]>("/branches"),
      apiRequest<InventoryItem[]>("/branch-inventory"),
      apiRequest<Movement[]>("/inventory-movements"),
    ]);

    const failures: string[] = [];
    if (results[0].status === "fulfilled") setProducts(results[0].value);
    else failures.push(`Productos: ${results[0].reason instanceof Error ? results[0].reason.message : "sin conexión"}`);
    if (results[1].status === "fulfilled") {
      setBranches(results[1].value);
      const firstBranchId = results[1].value[0]?.id || "";
      setSelectedBranchId((current) => current || firstBranchId);
    } else failures.push(`Sucursales: ${results[1].reason instanceof Error ? results[1].reason.message : "sin conexión"}`);
    if (results[2].status === "fulfilled") setInventory(results[2].value);
    else failures.push(`Inventario: ${results[2].reason instanceof Error ? results[2].reason.message : "sin conexión"}`);
    if (results[3].status === "fulfilled") setMovements(results[3].value);
    else failures.push(`Movimientos: ${results[3].reason instanceof Error ? results[3].reason.message : "sin conexión"}`);

    if (failures.length) setLoadError(failures.join(" · "));
    else setLoadError("");
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refreshData);
    void Promise.resolve().then(() => {
      const currentDate = new Date();
      setToday(currentDate);
      setClock(new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(currentDate));
    });
    const token = window.localStorage.getItem("plastics-pos-token");
    if (token) {
      apiRequest<{ user: User }>("/auth/profile")
        .then((result) => setUser(result.user))
        .catch((authError: unknown) => {
          window.localStorage.removeItem("plastics-pos-token");
          setNotice(authError instanceof Error ? `Tu sesión expiró: ${authError.message}` : "Tu sesión expiró. Inicia sesión de nuevo.");
        });
    }
  }, [refreshData]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const activeSection = sectionInfo[section];
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);
  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const inventoryValue = inventory.reduce((sum, item) => sum + item.quantity * Number(item.product.price), 0);
  const lowStock = inventory.filter((item) => item.quantity <= 10).length;
  const monthMovements = today ? movements.filter((movement) => {
    const date = new Date(movement.createdAt);
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }).length : 0;
  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.sku}`.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredInventory = inventory.filter((item) => {
    const matchesBranch = branchFilter === "all" || item.branch.id === branchFilter;
    return matchesBranch && `${item.product.name} ${item.product.sku} ${item.branch.name}`.toLowerCase().includes(search.toLowerCase());
  });
  const filteredMovements = movements.filter((movement) =>
    `${movement.product.name} ${movement.product.sku} ${movement.branch.name} ${movement.movementType}`.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredBranches = branches.filter((branch) =>
    `${branch.name} ${branch.address ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  const chartData = useMemo(() => {
    if (!today) {
      return Array.from({ length: 7 }, () => ({ label: "", count: 0, date: 0 }));
    }
    const now = today;
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const count = movements.filter((movement) => new Date(movement.createdAt).toDateString() === date.toDateString()).length;
      return {
        label: new Intl.DateTimeFormat("es-MX", { weekday: "short" }).format(date).replace(".", ""),
        count,
        date: date.getDate(),
      };
    });
  }, [movements, today]);
  const chartMax = Math.max(1, ...chartData.map((item) => item.count));

  function handleLogin(token: string, nextUser: User) {
    window.localStorage.setItem("plastics-pos-token", token);
    setUser(nextUser);
    setNotice(`Sesión iniciada como ${nextUser.name || nextUser.email}`);
  }

  function signOut() {
    window.localStorage.removeItem("plastics-pos-token");
    setUser(null);
    setNotice("Sesión cerrada.");
  }

  const actionText = section === "products"
    ? "Agregar producto"
    : section === "branches"
      ? "Agregar sucursal"
      : section === "inventory" && inventory.length === 0
        ? "Registrar existencias"
        : "Nuevo movimiento";
  const actionMode: ModalMode = section === "products"
    ? "product"
    : section === "branches"
      ? "branch"
      : section === "inventory" && inventory.length === 0
        ? "stock"
        : "movement";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" aria-label="mr. plastic branding">
          <Image className="brand-logo" src="/mr-plastic-logo.jpeg" alt="mr. plastic" width={210} height={150} priority />
        </div>
        <div className="branch-switcher">
          <div className="branch-icon"><Icon name="store" size={18} /></div>
          <div className="branch-copy"><small>SUCURSAL ACTIVA</small><strong>{selectedBranch?.name ?? (branches.length ? "Todas las sucursales" : "Sin sucursales")}</strong></div>
          <Icon name="down" size={15} />
          <select aria-label="Seleccionar sucursal" value={selectedBranchId} onChange={(event) => setSelectedBranchId(event.target.value)}>
            <option value="">Todas las sucursales</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        </div>

        <nav className="side-nav" aria-label="Navegación principal">
          <p className="nav-caption">MENÚ PRINCIPAL</p>
          {menu.map(({ section: itemSection, icon }) => (
            <button type="button" key={itemSection} className={`nav-link ${section === itemSection ? "selected" : ""}`} onClick={() => { setSection(itemSection); setSearch(""); }}>
              <Icon name={icon} size={19} /><span>{sectionInfo[itemSection].label}</span>
              {itemSection === "inventory" && lowStock > 0 && <span className="nav-badge">{lowStock}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className={`connection-card ${loadError ? "connection-error" : ""}`}>
            <span className="connection-dot" />
            <span><strong>{loadError ? "Conexión pendiente" : "Sistema conectado"}</strong><small>{loadError ? "Verifica tu API" : "Sincronización activa"}</small></span>
            <button type="button" className="connection-refresh" aria-label="Actualizar datos" onClick={() => { setLoading(true); void refreshData(); }}><Icon name="refresh" size={16} /></button>
          </div>
          <button type="button" className="profile-button" onClick={() => user ? signOut() : setModal("login")}>
            <span className="avatar">{(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}</span>
            <span className="profile-text"><strong>{user?.name || "Iniciar sesión"}</strong><small>{user ? user.role.replaceAll("_", " ") : "Accede a tu cuenta"}</small></span>
            <Icon name={user ? "logout" : "more"} size={18} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Mr. Plastic</span><Icon name="chevron" size={14} /><strong>{activeSection.label}</strong></div>
          <div className="topbar-actions">
            <label className="global-search"><Icon name="search" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." aria-label="Buscar" /><kbd>⌘ K</kbd></label>
            <button type="button" className="icon-button notification-button" aria-label="Notificaciones" onClick={() => setNotice(lowStock ? `Tienes ${lowStock} productos con existencias bajas.` : "No tienes notificaciones pendientes.")}><Icon name="bell" size={19} />{lowStock > 0 && <span />}</button>
            <div className="topbar-divider" />
            <button type="button" className="user-chip" onClick={() => user ? signOut() : setModal("login")}><span className="avatar">{(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}</span><span>{user?.name?.split(" ")[0] || "Cuenta"}</span><Icon name="down" size={15} /></button>
          </div>
        </header>

        <div className="page-content">
          {loadError && <div className="alert-banner" role="alert"><Icon name="warning" size={19} /><div><strong>No se pudieron cargar todos los datos</strong><span>{loadError}. Confirma que el backend esté disponible y configura BACKEND_URL si usa otro puerto.</span></div><button type="button" onClick={() => { setLoading(true); void refreshData(); }}>Reintentar</button></div>}

          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" />OPERACIÓN</div>
              <h1>{activeSection.title}</h1>
              <p>{activeSection.description}</p>
            </div>
            <div className="heading-actions">
              <div className="date-chip"><Icon name="calendar" size={17} /><span>{clock || "Hoy"}</span></div>
              <button type="button" className="button button-primary" onClick={() => setModal(actionMode)}><Icon name="plus" size={18} />{actionText}</button>
            </div>
          </div>

          {loading && products.length === 0 && branches.length === 0 ? (
            <div className="loading-panel"><span className="spinner" /><strong>Conectando con tu inventario...</strong><span>Estamos cargando los datos del backend.</span></div>
          ) : section === "overview" ? (
            <Overview
              products={products}
              branches={branches}
              inventory={inventory}
              movements={movements}
              totalUnits={totalUnits}
              inventoryValue={inventoryValue}
              lowStock={lowStock}
              monthMovements={monthMovements}
              chartData={chartData}
              chartMax={chartMax}
              selectedBranchId={selectedBranchId}
              setSection={setSection}
              onCreateMovement={() => setModal("movement")}
            />
          ) : section === "products" ? (
            <ProductsView products={filteredProducts} total={products.length} search={search} onAdd={() => setModal("product")} />
          ) : section === "inventory" ? (
            <InventoryView
              items={filteredInventory}
              branches={branches}
              search={search}
              branchFilter={branchFilter}
              onBranchFilter={setBranchFilter}
              onMovement={() => setModal("movement")}
              onAddStock={() => setModal("stock")}
            />
          ) : section === "movements" ? (
            <MovementsView movements={filteredMovements} />
          ) : (
            <BranchesView branches={filteredBranches} inventory={inventory} onAdd={() => setModal("branch")} />
          )}

          <footer className="page-footer"><span>© {today?.getFullYear() ?? ""} Mr. Plastic</span><span>Inventario claro. Negocio en orden.</span><span className="footer-status"><i />Todos los sistemas operativos</span></footer>
        </div>
      </main>
      {notice && <div className="toast" role="status"><span className="toast-check">✓</span>{notice}<button type="button" aria-label="Cerrar notificación" onClick={() => setNotice("")}><Icon name="close" size={15} /></button></div>}
      {modal && <ActionModal mode={modal} branches={branches} products={products} selectedBranchId={selectedBranchId} onClose={() => setModal(null)} onSaved={refreshData} onLogin={handleLogin} />}
    </div>
  );
}

function Overview({
  products,
  branches,
  inventory,
  movements,
  totalUnits,
  inventoryValue,
  lowStock,
  monthMovements,
  chartData,
  chartMax,
  selectedBranchId,
  setSection,
  onCreateMovement,
}: {
  products: Product[];
  branches: Branch[];
  inventory: InventoryItem[];
  movements: Movement[];
  totalUnits: number;
  inventoryValue: number;
  lowStock: number;
  monthMovements: number;
  chartData: { label: string; count: number; date: number }[];
  chartMax: number;
  selectedBranchId: string;
  setSection: (section: Section) => void;
  onCreateMovement: () => void;
}) {
  const branchInventory = selectedBranchId ? inventory.filter((item) => item.branch.id === selectedBranchId) : inventory;
  const branchUnits = branchInventory.reduce((sum, item) => sum + item.quantity, 0);
  const recentMovements = movements.slice(0, 5);
  const lowItems = branchInventory.filter((item) => item.quantity <= 10).slice(0, 4);

  return (
    <>
      <section className="welcome-banner">
        <div className="welcome-content">
          <span className="welcome-kicker"><span /> TU NEGOCIO, EN ORDEN</span>
          <h2>Buen día. <span>¿Listo para vender?</span></h2>
          <p>Revisa tus existencias y mantén cada sucursal al día.</p>
          <button type="button" className="welcome-button" onClick={onCreateMovement}>Registrar movimiento <Icon name="chevron" size={16} /></button>
        </div>
        <div className="welcome-illustration" aria-hidden="true">
          <div className="illustration-sun" />
          <div className="illustration-plant plant-one"><i /><i /><i /><b /></div>
          <div className="illustration-plant plant-two"><i /><i /><i /><b /></div>
          <div className="illustration-box box-one"><span>PLASTI</span></div>
          <div className="illustration-box box-two"><span>POS</span></div>
          <div className="illustration-ground" />
        </div>
        <div className="welcome-decoration decoration-one" />
        <div className="welcome-decoration decoration-two" />
      </section>

      <section className="stats-grid" aria-label="Indicadores">
        <StatCard label="Productos activos" value={products.filter((product) => product.isActive).length.toLocaleString("es-MX")} note={`${products.length} en catálogo`} icon="box" tint="mint" />
        <StatCard label="Unidades en stock" value={branchUnits.toLocaleString("es-MX")} note={selectedBranchId ? "En la sucursal activa" : "En todas las sucursales"} icon="layers" tint="blue" />
        <StatCard label="Existencias bajas" value={lowStock.toLocaleString("es-MX")} note={lowStock ? "Requieren atención" : "Todo bajo control"} icon="warning" tint="amber" />
        <StatCard label="Movimientos del mes" value={monthMovements.toLocaleString("es-MX")} note={`${branches.length} sucursales activas`} icon="trend" tint="violet" />
      </section>

      <section className="overview-grid">
        <div className="panel activity-panel">
          <div className="panel-heading">
            <div><h2>Actividad de inventario</h2><p>Movimientos registrados en los últimos 7 días</p></div>
            <button type="button" className="text-button" onClick={() => setSection("movements")}>Ver movimientos <Icon name="chevron" size={15} /></button>
          </div>
          <div className="chart-summary"><strong>{movements.length.toLocaleString("es-MX")}</strong><span>movimientos registrados</span><span className="chart-trend"><Icon name="trend" size={14} /> actividad total</span></div>
          <div className="chart-area" role="img" aria-label="Gráfica de movimientos en los últimos siete días">
            <div className="chart-y-labels"><span>{chartMax}</span><span>{Math.ceil(chartMax / 2)}</span><span>0</span></div>
            <div className="chart-columns">
              {chartData.map((item, index) => (
                <div className="chart-column" key={`${item.label}-${item.date}`}>
                  <div className="chart-bar-wrap"><span className="chart-value">{item.count || ""}</span><div className={`chart-bar ${index === 6 ? "today" : ""}`} style={{ height: `${Math.max(4, (item.count / chartMax) * 100)}%` }} /></div>
                  <span className="chart-label">{item.label}<small>{item.date}</small></span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend"><span><i /> Movimientos por día</span><span>Valor estimado del inventario <strong>{formatCurrency(inventoryValue)}</strong></span></div>
        </div>

        <div className="panel stock-panel">
          <div className="panel-heading">
            <div><h2>Existencias bajas</h2><p>Productos con 10 unidades o menos</p></div>
            <span className={`count-pill ${lowItems.length ? "count-alert" : ""}`}>{lowItems.length}</span>
          </div>
          {lowItems.length ? (
            <div className="low-stock-list">
              {lowItems.map((item) => <div className="low-stock-item" key={item.id}>
                <div className="product-avatar">{item.product.name.slice(0, 1).toUpperCase()}</div>
                <div className="low-stock-info"><strong>{item.product.name}</strong><span>{item.product.sku} · {item.branch.name}</span></div>
                <div className="quantity-alert"><strong>{item.quantity}</strong><span>unidades</span></div>
              </div>)}
            </div>
          ) : <EmptyState title="Existencias saludables" detail="No hay productos por debajo del mínimo sugerido." />}
          <button type="button" className="panel-bottom-link" onClick={() => setSection("inventory")}>Revisar inventario <Icon name="chevron" size={15} /></button>
        </div>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div><h2>Movimientos recientes</h2><p>Última actividad en todas tus sucursales</p></div>
          <button type="button" className="button button-outline" onClick={() => setSection("movements")}>Ver todo <Icon name="chevron" size={15} /></button>
        </div>
        <MovementTable movements={recentMovements} compact />
      </section>
      <div className="overview-footnote"><Icon name="cart" size={16} /><span>Actualmente hay <strong>{totalUnits.toLocaleString("es-MX")} unidades</strong> en inventario en {branches.length} sucursales.</span></div>
    </>
  );
}

function StatCard({ label, value, note, icon, tint }: { label: string; value: string; note: string; icon: string; tint: string }) {
  return <article className="stat-card"><div className={`stat-icon ${tint}`}><Icon name={icon} size={19} /></div><span className="stat-note">{note}</span><span className="stat-value">{value}</span><span className="stat-label">{label}</span><span className="stat-corner" /></article>;
}

function ProductsView({ products, total, search, onAdd }: { products: Product[]; total: number; search: string; onAdd: () => void }) {
  return (
    <section className="panel data-panel">
      <div className="panel-heading">
        <div><h2>Todos los productos</h2><p>{search ? `${products.length} resultados` : `${total} productos en tu catálogo`}</p></div>
        <button type="button" className="button button-outline" onClick={onAdd}><Icon name="plus" size={16} />Agregar producto</button>
      </div>
      {products.length ? <div className="table-scroll"><table><thead><tr><th>PRODUCTO</th><th>SKU</th><th>UNIDAD</th><th>PRECIO</th><th>ESTADO</th></tr></thead><tbody>
        {products.map((product) => <tr key={product.id}><td><div className="product-cell"><span className="product-avatar">{product.name.slice(0, 1).toUpperCase()}</span><span><strong>{product.name}</strong><small>{product.description || "Sin descripción"}</small></span></div></td><td><span className="sku-tag">{product.sku}</span></td><td>{product.unit}</td><td className="price-cell">{formatCurrency(product.price)}</td><td><span className={`status-pill ${product.isActive ? "status-active" : "status-inactive"}`}><i />{product.isActive ? "Activo" : "Inactivo"}</span></td></tr>)}
      </tbody></table></div> : <EmptyState title={search ? "No encontramos productos" : "Tu catálogo está vacío"} detail={search ? "Prueba con otro nombre o SKU." : "Agrega tu primer producto para comenzar a controlar existencias."} action={!search ? <button type="button" className="button button-primary" onClick={onAdd}><Icon name="plus" size={17} />Agregar producto</button> : undefined} />}
    </section>
  );
}

function InventoryView({ items, branches, branchFilter, search, onBranchFilter, onMovement, onAddStock }: {
  items: InventoryItem[];
  branches: Branch[];
  branchFilter: string;
  search: string;
  onBranchFilter: (value: string) => void;
  onMovement: () => void;
  onAddStock: () => void;
}) {
  return (
    <section className="panel data-panel">
      <div className="panel-heading inventory-heading">
        <div><h2>Existencias por producto</h2><p>Unidades disponibles y valor estimado</p></div>
        <div className="table-actions"><label className="select-filter"><Icon name="store" size={16} /><select value={branchFilter} onChange={(event) => onBranchFilter(event.target.value)}><option value="all">Todas las sucursales</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select><Icon name="down" size={14} /></label><button type="button" className="button button-outline" onClick={onAddStock}><Icon name="plus" size={16} />Registrar existencias</button><button type="button" className="button button-primary" onClick={onMovement}><Icon name="plus" size={17} />Nuevo movimiento</button></div>
      </div>
      {items.length ? <div className="table-scroll"><table><thead><tr><th>PRODUCTO</th><th>SUCURSAL</th><th>EXISTENCIAS</th><th>VALOR ESTIMADO</th><th>ACTUALIZADO</th><th>ESTADO</th></tr></thead><tbody>
        {items.map((item) => <tr key={item.id}><td><div className="product-cell"><span className="product-avatar">{item.product.name.slice(0, 1).toUpperCase()}</span><span><strong>{item.product.name}</strong><small>{item.product.sku}</small></span></div></td><td>{item.branch.name}</td><td><strong className="quantity-cell">{item.quantity}</strong><span className="muted-cell"> {item.product.unit}</span></td><td className="price-cell">{formatCurrency(item.quantity * Number(item.product.price))}</td><td>{formatDate(item.updatedAt)}</td><td><StockStatus quantity={item.quantity} /></td></tr>)}
      </tbody></table></div> : <EmptyState title={search || branchFilter !== "all" ? "No encontramos existencias" : "Sin existencias registradas"} detail={search || branchFilter !== "all" ? "Prueba con otros términos o selecciona otra sucursal." : "Registra el inventario inicial para empezar a hacer movimientos."} action={search || branchFilter !== "all" ? undefined : <button type="button" className="button button-primary" onClick={onAddStock}><Icon name="plus" size={17} />Registrar existencias</button>} />}
    </section>
  );
}

function StockStatus({ quantity }: { quantity: number }) {
  const level = quantity === 0 ? "empty" : quantity <= 10 ? "low" : "good";
  const label = level === "empty" ? "Agotado" : level === "low" ? "Stock bajo" : "Disponible";
  return <span className={`status-pill stock-${level}`}><i />{label}</span>;
}

function MovementsView({ movements }: { movements: Movement[] }) {
  return <section className="panel data-panel">
    <div className="panel-heading"><div><h2>Historial de movimientos</h2><p>{movements.length} registros ordenados por actividad reciente</p></div><div className="movement-legend"><span><i className="legend-entry" /> Entrada</span><span><i className="legend-exit" /> Salida</span></div></div>
    {movements.length ? <MovementTable movements={movements} /> : <EmptyState title="Aún no hay movimientos" detail="Cuando registres entradas o salidas, aparecerán aquí." />}
  </section>;
}

function MovementTable({ movements, compact = false }: { movements: Movement[]; compact?: boolean }) {
  return <div className="table-scroll"><table><thead><tr><th>MOVIMIENTO</th><th>PRODUCTO</th><th>SUCURSAL</th><th>CANTIDAD</th><th>REFERENCIA</th><th>FECHA</th></tr></thead><tbody>
    {movements.length ? movements.map((movement) => <tr key={movement.id}>
      <td><span className={`movement-type ${movement.movementType === "ENTRY" ? "entry" : "exit"}`}><Icon name={movement.movementType === "ENTRY" ? "down" : "chevron"} size={15} />{movement.movementType === "ENTRY" ? "Entrada" : "Salida"}</span></td>
      <td><div className="product-cell"><span className="product-avatar">{movement.product.name.slice(0, 1).toUpperCase()}</span><span><strong>{movement.product.name}</strong><small>{movement.product.sku}</small></span></div></td>
      <td>{movement.branch.name}</td><td><strong className="quantity-cell">{movement.movementType === "ENTRY" ? "+" : "−"}{movement.quantity}</strong><span className="muted-cell"> {movement.product.unit}</span></td>
      <td>{movement.referenceType || <span className="muted-cell">—</span>}</td><td><span className="date-cell">{formatDate(movement.createdAt)}{!compact && <small>{formatTime(movement.createdAt)}</small>}</span></td>
    </tr>) : <tr><td colSpan={6}><div className="table-empty">{EMPTY_MESSAGE}</div></td></tr>}
  </tbody></table></div>;
}

function BranchesView({ branches, inventory, onAdd }: { branches: Branch[]; inventory: InventoryItem[]; onAdd: () => void }) {
  return <section className="branch-page">
    <div className="branch-summary"><div className="summary-icon"><Icon name="store" size={21} /></div><div><strong>{branches.length}</strong><span>Sucursales registradas</span></div><div className="summary-divider" /><div><strong>{inventory.reduce((sum, item) => sum + item.quantity, 0).toLocaleString("es-MX")}</strong><span>Unidades en total</span></div><button type="button" className="button button-primary" onClick={onAdd}><Icon name="plus" size={17} />Agregar sucursal</button></div>
    {branches.length ? <div className="branch-grid">{branches.map((branch, index) => {
      const branchItems = inventory.filter((item) => item.branch.id === branch.id);
      const units = branchItems.reduce((sum, item) => sum + item.quantity, 0);
      const value = branchItems.reduce((sum, item) => sum + item.quantity * Number(item.product.price), 0);
      return <article className="branch-card" key={branch.id}>
        <div className={`branch-card-cover cover-${index % 4}`}><div className="branch-cover-mark"><Icon name="store" size={26} /></div><span className="status-pill status-active"><i />{branch.isActive ? "Activa" : "Inactiva"}</span></div>
        <div className="branch-card-body">        <div className="branch-name-row"><div><span className="branch-overline">SUCURSAL {String(index + 1).padStart(2, "0")}</span><h2>{branch.name}</h2></div></div><p className="branch-address">{branch.address || "Dirección no registrada"}</p><div className="branch-card-stats"><div><small>UNIDADES</small><strong>{units.toLocaleString("es-MX")}</strong></div><div><small>PRODUCTOS</small><strong>{branchItems.length}</strong></div><div><small>VALOR ESTIMADO</small><strong>{formatCurrency(value)}</strong></div></div><div className="branch-card-footer"><span><i className="branch-live-dot" />Operando</span><span>{branchItems.filter((item) => item.quantity <= 10).length ? `${branchItems.filter((item) => item.quantity <= 10).length} por reabastecer` : "Inventario saludable"}</span></div></div>
      </article>;
    })}</div> : <div className="panel"><EmptyState title="Aún no hay sucursales" detail="Agrega una sucursal para empezar a organizar tus existencias." action={<button type="button" className="button button-primary" onClick={onAdd}><Icon name="plus" size={17} />Agregar sucursal</button>} /></div>}
  </section>;
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Icon name="box" size={22} /></div><strong>{title}</strong><p>{detail}</p>{action}</div>;
}
