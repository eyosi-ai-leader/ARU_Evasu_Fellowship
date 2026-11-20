"use client";

import { useEffect, useMemo, useState } from "react";

import { getFellowships } from "@/lib/fellowshipApi";
import { useAccess } from "@/components/dashboard/access/AccessProvider";

/**
 * Returns, for a dashboard page:
 *   access   - what the signed-in person is allowed to be and do (GET /api/me,
 *              loaded once for the whole dashboard by AccessProvider)
 *   campuses - the campus fellowships they manage, with names
 *              (every campus for a Super Admin)
 *
 * While loading:    { loading: true }
 * If /api/me fails: { access: null, error: "..." } so a page can fall back
 *                   to the role saved at sign-in.
 */
export default function useMyAccess() {
  const { access, loading: accessLoading, error } = useAccess();

  const [fellowships, setFellowships] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getFellowships()
      .then((list) => {
        if (!cancelled) setFellowships(list);
      })
      .catch(() => {
        if (!cancelled) setFellowships([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const campuses = useMemo(() => {
    if (!access || !fellowships) return [];

    if (access.scope?.all) return fellowships;

    const manageIds = access.scope?.memberFellowshipIds || [];

    return fellowships.filter((fellowship) =>
      manageIds.includes(Number(fellowship.id))
    );
  }, [access, fellowships]);

  return {
    access,
    campuses,
    loading: accessLoading || fellowships === null,
    error,
  };
}