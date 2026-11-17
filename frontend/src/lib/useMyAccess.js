"use client";

import { useEffect, useState } from "react";

import { getFellowships, getMyAccess } from "@/lib/fellowshipApi";

/**
 * Loads, once per page:
 *   access   - what the signed-in person is allowed to be and do (GET /api/me)
 *   campuses - the campus fellowships they manage, with names
 *              (everything for a Super Admin)
 *
 * While loading:   { loading: true }
 * If /api/me fails: { access: null, error: "..." } so a page can fall back
 *                   to the role saved at sign-in.
 */
export default function useMyAccess() {
  const [state, setState] = useState({
    access: null,
    campuses: [],
    loading: true,
    error: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [access, fellowships] = await Promise.all([
          getMyAccess(),
          getFellowships().catch(() => []),
        ]);

        if (cancelled) {
          return;
        }

        const manageIds = access?.scope?.memberFellowshipIds || [];

        const campuses = access?.scope?.all
          ? fellowships
          : fellowships.filter((fellowship) =>
              manageIds.includes(Number(fellowship.id))
            );

        setState({ access, campuses, loading: false, error: "" });
      } catch (error) {
        if (!cancelled) {
          setState({
            access: null,
            campuses: [],
            loading: false,
            error: error.message || "Could not load your access.",
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}