"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  ShieldCheck,
  UserRoundCheck,
  Trash2,
} from "lucide-react";

const itemClass =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900";

export default function MemberActionsMenu({
  member,
  onDelete,
  onChangeStatus,
  onChangeRole,
  canManage,
  // What this person may do to THIS member (the table works it out).
  canEdit = true,
  canChangeRole = true,
  canDelete = true,
  // "up" for the last rows, so the menu is not cut off at the bottom.
  placement = "down",
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKey(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function handleAction(callback) {
    setOpen(false);

    if (callback) {
      callback(member);
    }
  }

  /*
   * This menu is only for people who manage members.
   * Keep this guard as a second frontend protection layer;
   * the backend checks every request again.
   */
  if (!canManage) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      <button
        type="button"
        title="More actions"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() =>
          setOpen((value) => !value)
        }
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 sm:h-8 sm:w-8"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-50 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ${
            placement === "up"
              ? "bottom-10"
              : "top-10"
          }`}
        >
          <Link
            href={`/dashboard/members/${member.id}`}
            onClick={() => setOpen(false)}
            role="menuitem"
            className={itemClass}
          >
            <Eye size={15} />
            View Member
          </Link>

          {canEdit && (
            <Link
              href={`/dashboard/members/${member.id}/edit`}
              onClick={() => setOpen(false)}
              role="menuitem"
              className={itemClass}
            >
              <Pencil size={15} />
              Edit Member
            </Link>
          )}

          {(canEdit || canChangeRole) && (
            <div className="my-1 border-t border-slate-100" />
          )}

          {canEdit && (
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                handleAction(onChangeStatus)
              }
              className={itemClass}
            >
              <UserRoundCheck size={15} />
              Change Status
            </button>
          )}

          {canChangeRole && (
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                handleAction(onChangeRole)
              }
              className={itemClass}
            >
              <ShieldCheck size={15} />
              Change Role
            </button>
          )}

          {canDelete && (
            <>
              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  handleAction(onDelete)
                }
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={15} />
                Delete Member
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}