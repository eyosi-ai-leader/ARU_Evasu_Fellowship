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
  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-xs font-medium text-body transition hover:bg-primary/5 hover:text-primary";

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
        className="flex h-9 w-9 items-center justify-center rounded-full text-body transition hover:bg-primary/10 hover:text-primary active:scale-[0.97] sm:h-8 sm:w-8"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-50 w-56 overflow-hidden rounded-3xl bg-white p-2 shadow-soft ring-1 ring-line ${
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
            <div className="my-1.5 border-t border-line" />
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
              <div className="my-1.5 border-t border-line" />

              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  handleAction(onDelete)
                }
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-xs font-medium text-danger transition hover:bg-danger/10"
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