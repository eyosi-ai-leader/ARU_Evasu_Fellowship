const dashboardModel = require("../models/dashboardModel");

const {
  getManagedCampusIds,
  pickCampusIds,
} = require("../utils/accessScope");

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

module.exports = {
  getDashboardOverview,
};