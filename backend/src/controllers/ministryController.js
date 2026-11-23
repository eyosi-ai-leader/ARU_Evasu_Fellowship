const ministryService = require("../services/ministryService");

const sendError = (res, error) => {
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "A ministry with this name already exists in this campus.",
    });
  }

  if (!error.statusCode) {
    console.error("Ministry API error:", error);
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode
      ? error.message
      : "Ministry operation failed.",
  });
};

const respond =
  (work, { message, status = 200 }) =>
  async (req, res) => {
    try {
      const data = await work(req);

      return res.status(status).json({ success: true, message, data });
    } catch (error) {
      return sendError(res, error);
    }
  };

// Campus managers

const list = respond(
  (req) =>
    ministryService.listMinistries(req.access, {
      search: String(req.query.search || "").trim(),
      status: String(req.query.status || "").trim(),
      fellowshipId: req.query.fellowshipId,
    }),
  { message: "Ministries retrieved successfully." }
);

const getById = respond(
  (req) => ministryService.getMinistry(req.access, req.params.id),
  { message: "Ministry retrieved successfully." }
);

const create = respond(
  (req) => ministryService.createMinistry(req.access, req.body, req.file),
  {
    message: "Ministry created successfully.",
    status: 201,
  }
);

const update = respond(
  (req) =>
    ministryService.updateMinistry(
      req.access,
      req.params.id,
      req.body,
      req.file
    ),
  { message: "Ministry updated successfully." }
);

const updateStatus = respond(
  (req) =>
    ministryService.updateStatus(req.access, req.params.id, req.body.status),
  { message: "Ministry status updated successfully." }
);

const getMembers = respond(
  (req) =>
    ministryService.getMembers(
      req.access,
      req.params.id,
      String(req.query.role || ""),
      String(req.query.status || "Active")
    ),
  { message: "Ministry assignments retrieved successfully." }
);

const assignMember = respond(
  (req) =>
    ministryService.assignMember(
      req.access,
      req.params.id,
      req.body.memberId,
      req.body.assignmentRole || "Member"
    ),
  { message: "Assignment saved successfully.", status: 201 }
);

const removeAssignment = respond(
  (req) =>
    ministryService.removeAssignment(
      req.access,
      req.params.id,
      req.params.memberId
    ),
  { message: "Ministry assignment ended successfully." }
);

const moveMember = respond(
  (req) =>
    ministryService.moveMember(
      req.access,
      req.params.id,
      req.body.toMinistryId,
      req.params.memberId
    ),
  { message: "Member moved successfully." }
);

// Managers (to pick a leader or member) and the ministry's own leaders.
const getCandidates = respond(
  (req) =>
    ministryService.getCandidates(
      req.access,
      req.params.id,
      String(req.query.search || "")
    ),
  { message: "Members retrieved successfully." }
);

// Ministry Leaders

const getMyMinistries = respond(
  (req) => ministryService.getLeaderMinistries(req.access),
  { message: "Your ministries retrieved successfully." }
);

const getLeaderMembers = respond(
  (req) =>
    ministryService.getLeaderMembers(
      req.params.id,
      req.access,
      String(req.query.status || "Active")
    ),
  { message: "Your ministry members retrieved successfully." }
);

const updateLeaderMinistry = respond(
  (req) =>
    ministryService.updateLeaderMinistry(
      req.params.id,
      req.access,
      req.body,
      req.file
    ),
  { message: "Your ministry details updated successfully." }
);

const assignLeaderMember = respond(
  (req) =>
    ministryService.assignLeaderMember(
      req.params.id,
      req.access,
      req.body.memberId
    ),
  { message: "Member added to your ministry successfully.", status: 201 }
);

const removeLeaderAssignment = respond(
  (req) =>
    ministryService.removeLeaderAssignment(
      req.params.id,
      req.access,
      req.params.memberId
    ),
  { message: "Member removed from your ministry successfully." }
);

const updateLeaderAssignmentStatus = respond(
  (req) =>
    ministryService.updateLeaderAssignmentStatus(
      req.params.id,
      req.access,
      req.params.memberId,
      req.body.status
    ),
  { message: "Member assignment status updated successfully." }
);

const listCampuses = respond(
  (req) => ministryService.listCampuses(req.access),
  { message: "Campuses retrieved successfully." }
);

const remove = respond(
  (req) => ministryService.deleteMinistry(req.access, req.params.id),
  { message: "Ministry deleted successfully." }
);

const updateMemberStatus = respond(
  (req) =>
    ministryService.updateMemberStatus(
      req.access,
      req.params.id,
      req.params.memberId,
      req.body.status
    ),
  { message: "Assignment status updated successfully." }
);

module.exports = {
  list,
  getById,
  create,
  update,
  updateStatus,
  getMembers,
  assignMember,
  removeAssignment,
  moveMember,
  getCandidates,
  getMyMinistries,
  getLeaderMembers,
  updateLeaderMinistry,
  assignLeaderMember,
  removeLeaderAssignment,
  updateLeaderAssignmentStatus,
  listCampuses,
  remove,
  updateMemberStatus,
};