import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Pencil, Eye, EyeOff, Sparkles, Trash2, X, Save } from "lucide-react";
import { Sidebar } from "@/components/pos/Sidebar";
import { CategoryRail } from "@/components/pos/CategoryRail";
import { CATEGORIES, MENU, type Category, type MenuItem } from "@/lib/menu-data";

const CATEGORY_OPTIONS = CATEGORIES.map((category) => category.id).filter(
  (category): category is MenuItem["category"] => category !== "All",
);
const TAG_OPTIONS: NonNullable<MenuItem["tag"]>[] = ["Bestseller", "New", "Hot", "Deal"];

type MenuDraft = {
  name: string;
  desc: string;
  category: MenuItem["category"];
  price: string;
  tag: "" | NonNullable<MenuItem["tag"]>;
  image: string;
};

const imageByCategory = (category: MenuItem["category"]) =>
  MENU.find((item) => item.category === category)?.image ?? MENU[0].image;

const createEmptyDraft = (): MenuDraft => ({
  name: "",
  desc: "",
  category: "Pizza",
  price: "",
  tag: "",
  image: imageByCategory("Pizza"),
});

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu Manager · BJ Pizza" },
      { name: "description", content: "Curate the BJ Pizza menu — edit items, toggle availability, manage categories." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const [cat, setCat] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<MenuDraft>(createEmptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const items = useMemo(
    () =>
      menuItems.filter((m) => (cat === "All" ? true : m.category === cat)).filter(
        (m) =>
          !query.trim() ||
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.desc.toLowerCase().includes(query.toLowerCase()),
      ),
    [cat, query, menuItems],
  );

  const toggle = (id: string) => setHidden((h) => ({ ...h, [id]: !h[id] }));

  const openCreate = () => {
    setEditingId(null);
    setDraft(createEmptyDraft());
    setIsEditorOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      desc: item.desc,
      category: item.category,
      price: item.price.toString(),
      tag: item.tag ?? "",
      image: item.image,
    });
    setIsEditorOpen(true);
  };

  const closeEditor = () => setIsEditorOpen(false);

  const saveItem = () => {
    const name = draft.name.trim();
    const desc = draft.desc.trim();
    const price = Number(draft.price);
    if (!name || !desc || !Number.isFinite(price) || price <= 0) return;

    const nextItem: MenuItem = {
      id: editingId ?? `custom-${Date.now()}`,
      name,
      desc,
      category: draft.category,
      price,
      tag: draft.tag || undefined,
      image: draft.image || imageByCategory(draft.category),
    };

    setMenuItems((current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? nextItem : item))
        : [nextItem, ...current],
    );
    closeEditor();
  };

  const deleteItem = (id: string) => {
    setMenuItems((current) => current.filter((item) => item.id !== id));
    setHidden((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  return (
    <div className="min-h-screen p-4">
      <div className="flex gap-4 max-w-[1800px] mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col gap-5">
          {/* Hero header */}
          <div className="glass-strong rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold flex items-center gap-2">
                <Sparkles className="size-3" /> Menu Manager
              </p>
              <h1 className="font-display text-3xl md:text-4xl tracking-wider mt-2">
                CURATE YOUR MENU
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {menuItems.length} items · {new Set(menuItems.map((m) => m.category)).size} categories
              </p>
            </div>
            <motion.button
              onClick={openCreate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-12 px-5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 glow-red"
            >
              <Plus className="size-4" />
              <span className="font-display tracking-widest">NEW ITEM</span>
            </motion.button>
          </div>

          {/* Search */}
          <div className="glass rounded-xl flex items-center gap-3 px-4 h-12">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu items…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>

          <CategoryRail active={cat} onChange={setCat} />

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
            {items.map((item) => (
              <MenuRow
                key={item.id}
                item={item}
                hidden={!!hidden[item.id]}
                onToggle={() => toggle(item.id)}
                onEdit={() => openEdit(item)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
            {items.length === 0 && (
              <div className="col-span-full glass rounded-2xl p-12 text-center text-muted-foreground">
                No items match your search.
              </div>
            )}
          </div>

          {isEditorOpen && (
            <MenuEditor
              draft={draft}
              isEditing={!!editingId}
              onChange={setDraft}
              onClose={closeEditor}
              onSave={saveItem}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function MenuRow({
  item,
  hidden,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  hidden: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`glass-strong rounded-2xl p-3 flex gap-3 transition-opacity ${hidden ? "opacity-50" : ""}`}
    >
      <img src={item.image} alt={item.name} className="size-24 rounded-xl object-cover shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.desc}</p>
          </div>
          <p className="font-mono-num font-bold text-gold shrink-0">${item.price.toFixed(2)}</p>
        </div>
        <div className="mt-auto flex items-center gap-2 pt-2">
          <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-md bg-white/5 text-muted-foreground">
            {item.category}
          </span>
          {item.tag && (
            <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-md bg-primary/15 text-primary">
              {item.tag}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={onToggle}
              className="size-8 grid place-items-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground"
              aria-label={hidden ? "Show item" : "Hide item"}
            >
              {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
            <button
              onClick={onEdit}
              className="size-8 grid place-items-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground"
              aria-label={`Edit ${item.name}`}
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={onDelete}
              className="size-8 grid place-items-center rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MenuEditor({
  draft,
  isEditing,
  onChange,
  onClose,
  onSave,
}: {
  draft: MenuDraft;
  isEditing: boolean;
  onChange: (draft: MenuDraft) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const canSave = draft.name.trim() && draft.desc.trim() && Number(draft.price) > 0;

  return (
    <div className="fixed inset-0 z-50 bg-background/90 grid place-items-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-strong rounded-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-border/60 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
              {isEditing ? "Edit item" : "New item"}
            </p>
            <h2 className="font-display text-2xl tracking-wider mt-1">
              {isEditing ? "UPDATE MENU ITEM" : "ADD MENU ITEM"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="size-10 rounded-xl grid place-items-center hover:bg-white/5 text-muted-foreground hover:text-foreground"
            aria-label="Close editor"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 grid md:grid-cols-[160px_1fr] gap-5">
          <div className="space-y-3">
            <img
              src={draft.image || imageByCategory(draft.category)}
              alt={draft.name || "Menu preview"}
              className="aspect-square w-full rounded-2xl object-cover"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Image category ke hisaab se auto select hogi.
            </p>
          </div>

          <div className="grid gap-3">
            <label className="grid gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
              Item name
              <input
                value={draft.name}
                onChange={(event) => onChange({ ...draft, name: event.target.value })}
                placeholder="e.g. Cheese Burst Pizza"
                className="h-11 rounded-xl bg-secondary/60 border border-border/70 px-3 text-sm text-foreground outline-none focus:border-primary/60 normal-case tracking-normal"
              />
            </label>

            <label className="grid gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
              Description
              <textarea
                value={draft.desc}
                onChange={(event) => onChange({ ...draft, desc: event.target.value })}
                placeholder="Short premium description"
                className="min-h-20 rounded-xl bg-secondary/60 border border-border/70 p-3 text-sm text-foreground outline-none focus:border-primary/60 normal-case tracking-normal resize-none"
              />
            </label>

            <div className="grid sm:grid-cols-3 gap-3">
              <label className="grid gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                Price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.price}
                  onChange={(event) => onChange({ ...draft, price: event.target.value })}
                  placeholder="0.00"
                  className="h-11 rounded-xl bg-secondary/60 border border-border/70 px-3 text-sm text-foreground outline-none focus:border-primary/60 normal-case tracking-normal"
                />
              </label>

              <label className="grid gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                Category
                <select
                  value={draft.category}
                  onChange={(event) => {
                    const category = event.target.value as MenuItem["category"];
                    onChange({ ...draft, category, image: imageByCategory(category) });
                  }}
                  className="h-11 rounded-xl bg-secondary/60 border border-border/70 px-3 text-sm text-foreground outline-none focus:border-primary/60 normal-case tracking-normal"
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                Tag
                <select
                  value={draft.tag}
                  onChange={(event) =>
                    onChange({
                      ...draft,
                      tag: event.target.value as MenuDraft["tag"],
                    })
                  }
                  className="h-11 rounded-xl bg-secondary/60 border border-border/70 px-3 text-sm text-foreground outline-none focus:border-primary/60 normal-case tracking-normal"
                >
                  <option value="">None</option>
                  {TAG_OPTIONS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-border/60 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-11 px-4 rounded-xl border border-border/70 hover:bg-secondary/70 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!canSave}
            className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 glow-red disabled:opacity-50 disabled:pointer-events-none"
          >
            <Save className="size-4" />
            Save item
          </button>
        </div>
      </motion.div>
    </div>
  );
}
