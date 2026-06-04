"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown, GripVertical } from "lucide-react";

export interface ColumnDef<T> {
  id: string;
  header: string;
  width: number;
  minWidth?: number;
  sortable?: boolean;
  align?: "left" | "right";
  sticky?: boolean;
  visible?: boolean;
  cellClassName?: string;
  headerClassName?: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => number | string;
}

interface AdsManagerTableProps<T extends { id: string }> {
  rows: T[];
  columns: ColumnDef<T>[];
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  selected: Set<string>;
  onSelectRow: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
  onRowClick?: (row: T) => void;
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;
  emptyMessage?: string;
  minimal?: boolean;
  premium?: boolean;
}

export function AdsManagerTable<T extends { id: string }>({
  rows,
  columns,
  sortKey,
  sortDir,
  onSort,
  selected,
  onSelectRow,
  onSelectAll,
  onColumnWidthsChange,
  onRowClick,
  loadMoreRef,
  emptyMessage = "No results found",
  minimal = false,
  premium = false,
}: AdsManagerTableProps<T>) {
  const isDense = minimal || premium;
  const visibleCols = columns.filter((c) => c.visible !== false);
  const [widths, setWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(columns.map((c) => [c.id, c.width]))
  );
  const resizeRef = useRef<{
    colId: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!resizeRef.current) return;
      const { colId, startX, startWidth } = resizeRef.current;
      const col = columns.find((c) => c.id === colId);
      const min = col?.minWidth ?? 80;
      const next = Math.max(min, startWidth + (e.clientX - startX));
      setWidths((w) => ({ ...w, [colId]: next }));
    }
    function onUp() {
      if (resizeRef.current) {
        resizeRef.current = null;
        onColumnWidthsChange?.(widths);
      }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [columns, onColumnWidthsChange, widths]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = rows.some((r) => selected.has(r.id));

  const checkboxWidth = isDense ? 36 : 44;

  const stickyLeft = useCallback(
    (colIndex: number) => {
      let left = checkboxWidth;
      for (let i = 0; i < colIndex; i++) {
        if (visibleCols[i]?.sticky) {
          left += widths[visibleCols[i].id] ?? visibleCols[i].width;
        }
      }
      return left;
    },
    [visibleCols, widths, checkboxWidth]
  );

  function cellBg(zebra: boolean, isSelected: boolean) {
    if (premium) {
      if (isSelected) return "bg-[#5B47FB]/[0.06]";
      return "bg-white group-hover:bg-zinc-50/90";
    }
    if (minimal) {
      if (isSelected) return "bg-zinc-50";
      return "bg-transparent group-hover:bg-zinc-50/80";
    }
    if (isSelected) return "bg-accent-light group-hover:bg-violet-50";
    if (zebra) return "bg-zinc-50 group-hover:bg-violet-50";
    return "bg-card group-hover:bg-violet-50";
  }

  const headPy = premium ? "py-2" : minimal ? "py-1.5" : "py-2.5";
  const cellPy = premium ? "py-2" : minimal ? "py-1.5" : "py-2.5";
  const textSize = premium ? "text-[13px]" : minimal ? "text-[12px]" : "text-[13px]";

  function stickyZ(colIndex: number) {
    const stickyIndex = visibleCols
      .slice(0, colIndex + 1)
      .filter((c) => c.sticky).length;
    return stickyIndex <= 1 ? "z-30" : "z-29";
  }

  const totalWidth =
    checkboxWidth +
    visibleCols.reduce((sum, col) => sum + (widths[col.id] ?? col.width), 0);

  return (
    <div className="overflow-x-auto">
      <table
        className={cn("isolate w-full border-collapse", textSize)}
        style={isDense ? undefined : { width: totalWidth, minWidth: "100%" }}
      >
        <colgroup>
          <col style={{ width: checkboxWidth }} />
          {visibleCols.map((col) => (
            <col
              key={col.id}
              style={{ width: widths[col.id] ?? col.width }}
            />
          ))}
        </colgroup>
        <thead
          className={cn(
            "sticky top-0 z-20",
            premium
              ? "border-b border-zinc-200 bg-zinc-50/90"
              : minimal
                ? "border-b border-zinc-100 bg-background"
                : "bg-card shadow-[0_1px_0_#E5E7EB]"
          )}
        >
          <tr>
            <th
              className={cn(
                "sticky left-0 z-40 px-2 align-middle",
                headPy,
                premium ? "bg-zinc-50/90" : "bg-background"
              )}
              style={{ width: checkboxWidth }}
            >
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className={cn(
                    "rounded border-zinc-300 text-[#5B47FB] focus:ring-0",
                    isDense ? "h-3 w-3" : "h-3.5 w-3.5"
                  )}
                />
              </div>
            </th>
            {visibleCols.map((col, i) => (
              <th
                key={col.id}
                className={cn(
                  "relative select-none px-2 font-medium text-zinc-400",
                  headPy,
                  premium
                    ? "px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
                    : minimal
                      ? "text-[11px] normal-case tracking-normal"
                      : "px-3 text-[11px] font-semibold uppercase tracking-wide",
                  col.align === "right" ? "text-right" : "text-left",
                  col.sticky &&
                    !isDense &&
                    "sticky bg-card shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]",
                  col.sticky &&
                    premium &&
                    "sticky bg-zinc-50/90 shadow-[1px_0_0_#e4e4e7]",
                  col.sticky && minimal && "sticky bg-background",
                  col.sticky && stickyZ(i),
                  col.headerClassName
                )}
                style={{
                  left: col.sticky ? stickyLeft(i) : undefined,
                }}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSort(col.id)}
                    className={cn(
                      "inline-flex items-center gap-1 hover:text-accent/90",
                      col.align === "right" && "ml-auto"
                    )}
                  >
                    {col.header}
                    <SortIcon active={sortKey === col.id} dir={sortDir} />
                  </button>
                ) : (
                  col.header
                )}
                {!isDense ? (
                  <span
                    role="separator"
                    aria-orientation="vertical"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      resizeRef.current = {
                        colId: col.id,
                        startX: e.clientX,
                        startWidth: widths[col.id] ?? col.width,
                      };
                    }}
                    className="absolute -right-1 top-0 flex h-full w-2 cursor-col-resize items-center justify-center opacity-0 hover:opacity-100"
                  >
                    <GripVertical className="h-3 w-3 text-zinc-300" />
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={visibleCols.length + 1}
                className="px-4 py-16 text-center text-[13px] text-zinc-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const zebra = isDense ? false : i % 2 === 1;
              const isSelected = selected.has(row.id);
              const bg = cellBg(zebra, isSelected);

              return (
              <tr
                key={row.id}
                className={cn(
                  "group",
                  premium
                    ? "border-b border-zinc-100"
                    : minimal
                      ? "border-b border-zinc-50"
                      : "border-b border-border",
                  onRowClick && "cursor-pointer"
                )}
                onClick={(e) => {
                  if (!onRowClick) return;
                  const target = e.target as HTMLElement;
                  if (target.closest("button, input, a, label, [role='switch']")) {
                    return;
                  }
                  onRowClick(row);
                }}
              >
                <td
                  className={cn(
                    "sticky left-0 z-40 px-2 align-middle",
                    cellPy,
                    bg
                  )}
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectRow(row.id, e.target.checked)}
                      className={cn(
                        "rounded border-zinc-300 text-zinc-900 focus:ring-0",
                        isDense ? "h-3 w-3" : "h-3.5 w-3.5"
                      )}
                    />
                  </div>
                </td>
                {visibleCols.map((col, ci) => (
                  <td
                    key={col.id}
                    className={cn(
                      "px-2 align-middle",
                      cellPy,
                      col.align === "right" && "text-right",
                      bg,
                      col.sticky &&
                        premium &&
                        cn(
                          "sticky overflow-hidden bg-inherit shadow-[1px_0_0_#e4e4e7]",
                          stickyZ(ci)
                        ),
                      col.sticky &&
                        !isDense &&
                        cn(
                          "sticky overflow-hidden shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]",
                          stickyZ(ci)
                        ),
                      col.sticky && minimal && "sticky overflow-hidden bg-inherit",
                      col.cellClassName
                    )}
                    style={{
                      left: col.sticky ? stickyLeft(ci) : undefined,
                    }}
                  >
                    <div
                      className={cn(
                        col.sticky && "min-w-0 overflow-hidden",
                        col.id === "status" && "relative z-0"
                      )}
                    >
                      {col.render(row)}
                    </div>
                  </td>
                ))}
              </tr>
            );
            })
          )}
        </tbody>
      </table>
      {loadMoreRef && <div ref={loadMoreRef} className="h-4" />}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3 w-3 text-accent" />
  ) : (
    <ArrowDown className="h-3 w-3 text-accent" />
  );
}

export function ColumnsMenu({
  columns,
  onToggle,
  onClose,
}: {
  columns: { id: string; label: string; visible: boolean; locked?: boolean }[];
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-zinc-100 bg-white py-1 shadow-sm">
        <p className="px-3 py-1.5 text-[11px] text-zinc-400">Columns</p>
        {columns.map((col) => (
          <label
            key={col.id}
            className={cn(
              "flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] hover:bg-zinc-50",
              col.locked && "cursor-not-allowed opacity-60"
            )}
          >
            <input
              type="checkbox"
              checked={col.visible}
              disabled={col.locked}
              onChange={() => onToggle(col.id)}
              className="rounded border-border text-accent"
            />
            {col.label}
          </label>
        ))}
      </div>
    </>
  );
}
