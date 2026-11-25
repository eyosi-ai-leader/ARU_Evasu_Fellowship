const dashboardModel = require("../models/dashboardModel");

const {
  getManagedCampusIds,
  pickCampusIds,
} = require("../utils/accessScope");
const time = require("../utils/churchTime");

/**
 * Builds the dashboard from what the person may do.
 *
 * Sections are added by what the person holds, so someone who is a
 * Member and also leads a ministry gets both:
 *  - manage a campus  -> overview numbers (members, leaders, growth...)
 *  - leads ministries -> ministries + rosters
 *  - leads families   -> smallGroups
 *  - is a member      -> member (their own profile)
 */
async function getDashboardOverview(access, { fellowshipId } = {}) {
  const managedIds = getManagedCampusIds(access);
  const canManage = access.capabilities.includes("fellowship:manage");

  const campusIds = canManage ? pickCampusIds(access, fellowshipId) : [];
  const allSelected = campusIds.length === managedIds.length;

  const data = {
    role: access.roleLabel,
    heldRoles: access.roles,
    capabilities: access.capabilities,
    positions: access.positions,
    scope: {
      canManage,
      allCampuses: allSelected,
      // Set only when a person with several campuses picked one.
      selectedFellowshipId:
        managedIds.length > 1 && campusIds.length === 1
          ? campusIds[0]
          : null,
      campuses: [],
    },
  };

  // ------------------------------------------
  // Campus management overview
  // ------------------------------------------
  if (canManage && campusIds.length > 0) {
    const [
      members,
      byFellowship,
      structure,
      roles,
      recentActivity,
      memberGrowth,
      campuses,
    ] = await Promise.all([
      dashboardModel.getMemberStats(campusIds),
      dashboardModel.getCampusBreakdown(managedIds),
      dashboardModel.getStructureCounts(campusIds),
      dashboardModel.getRoleDistribution(
        campusIds,
        access.scope.all && allSelected
      ),
      dashboardModel.getRecentMembers(campusIds),
      dashboardModel.getMemberGrowth(campusIds),
      dashboardModel.getCampuses(managedIds),
    ]);

    data.members = members;
    data.byFellowship = byFellowship;
    data.structure = structure;
    data.roles = roles;
    data.recentActivity = recentActivity;
    data.memberGrowth = memberGrowth;
    data.scope.campuses = campuses;
  }

  // ------------------------------------------
  // Ministries this person leads
  // ------------------------------------------
  const ledIds = access.positions.ministriesLed.map((m) => m.id);

  if (ledIds.length > 0) {
    const ministries = await dashboardModel.getMinistriesLed(ledIds);

    data.ministries = ministries;
    data.summary = {
      totalMinistries: ministries.length,
      totalMembers: ministries.reduce(
        (total, ministry) => total + ministry.memberCount,
        0
      ),
    };
  } else if (access.capabilities.includes("ministry:lead")) {
    data.ministries = [];
    data.summary = { totalMinistries: 0, totalMembers: 0 };
    data.message = "You do not currently have an active ministry assignment.";
  }

  // ------------------------------------------
  // Families this person oversees (roster comes with the small group step)
  // ------------------------------------------
   if (access.positions.smallGroups.length > 0) {
    data.smallGroups = await dashboardModel.getSmallGroupsLed(
      access.positions.smallGroups.map((group) => group.id)
    );
  }

  // ------------------------------------------
  // The person's own member profile
  // ------------------------------------------
    if (access.member) {
    [data.member, data.myFellowship] = await Promise.all([
      dashboardModel.getOwnMember(access.user.id),
      dashboardModel.getMyFellowship(access.member.id),
    ]);
  } else if (Number(access.roleId) === 5) {
    data.member = null;
    data.message = "Member profile not found.";
  }

  return data;
}

/**
 * The signed-in person's own fellowship details: campus, studies, small
 * groups, families and ministries. Lighter than the full dashboard.
 */
async function getMyFellowshipProfile(access) {
  if (!access.member) return { member: null, fellowship: null };

  const [row, fellowship] = await Promise.all([
    dashboardModel.getProfileMember(access.user.id),
    dashboardModel.getMyFellowship(access.member.id),
  ]);

  return {
    member: row
      ? {
          memberNumber: row.member_number,
          status: row.status,
          joinedAt: row.created_at,
          campusId: row.fellowship_id,
          campusName: String(row.campus_name || "").replace(
            /\s+Fellowship$/i,
            ""
          ),
          department: row.department_name || "",
          studentId: row.student_id || "",
          academicStatus: row.academic_status,
          entryYear: row.entry_year,
          graduationYear: row.graduation_year,
        }
      : null,
    fellowship,
  };
}

const fullName = (first, last) => `${first || ""} ${last || ""}`.trim();

/* Announcements for the signed-in person's dashboard. */
async function getMyAnnouncements(access) {
  const rows = await dashboardModel.getMyAnnouncements(
    access.user.id,
    time.nowInChurch()
  );

  const items = rows.map((row) => ({
    id: row.id,
    subject: row.subject,
    message: row.message,
    priority: row.priority,
    category: row.category,
    pinned: Boolean(row.pinned),
    actionLabel: row.action_label,
    actionUrl: row.action_url,
    sender: fullName(row.first_name, row.last_name),
    createdAt: row.created_at,
    read: Boolean(row.read_at),
  }));

  return {
    items,
    unread: items.filter((item) => !item.read).length,
  };
}

async function markAnnouncementRead(access, id) {
  await dashboardModel.markAnnouncementRead(access.user.id, id);
}

const CIRCLE_LOADERS = {
  "small-groups": dashboardModel.getMySmallGroupCircles,
  families: dashboardModel.getMyFamilyCircles,
  ministries: dashboardModel.getMyMinistryCircles,
};

/* The groups, families or ministries the signed-in member belongs to, with people. */
async function getMyCircles(access, type) {
  const load = CIRCLE_LOADERS[type];

  if (!load || !access.member) return { items: [] };

  return { items: await load(access.member.id) };
}

module.exports = {
  getDashboardOverview,
  getMyFellowshipProfile,
  getMyAnnouncements,
  markAnnouncementRead,
  getMyCircles,
  
};