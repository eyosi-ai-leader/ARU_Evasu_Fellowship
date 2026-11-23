const { validationResult } = require("express-validator");

const {
  successResponse,
  errorResponse,
} = require("../utils/response");

const service = require("../services/announcementService");

const handle = (action) => async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return errorResponse(res, errors.array()[0].msg, 400, errors.array());
  }

  try {
    return await action(req, res);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }

    console.error("Announcement error:", error.message);

    return errorResponse(
      res,
      "Something went wrong. Please try again shortly.",
      500
    );
  }
};

const getOptions = handle(async (req, res) => {
  const data = await service.getAudienceOptions(req.access);
  return successResponse(res, "Audience options retrieved", data);
});

const searchMembers = handle(async (req, res) => {
  const data = await service.searchMembers(req.access, {
    search: req.query.search,
    campusId: req.query.campusId,
    ministryId: req.query.ministryId,
    smallGroupId: req.query.smallGroupId,
    page: req.query.page,
    delivery: req.query.delivery,
  });

  return successResponse(res, "Members retrieved", data);
});

const preview = handle(async (req, res) => {
  const data = await service.previewAudience(
    req.access,
    req.body.audience,
    req.body.delivery
  );

  return successResponse(res, "Audience previewed", data);
});

const sendTest = handle(async (req, res) => {
  await service.sendTest(req.access, req.body);
  return successResponse(res, "Test email sent to your address.", null);
});

const create = handle(async (req, res) => {
  const data = await service.createAnnouncement(req.access, req.body);

  return successResponse(
    res,
    data.scheduled
      ? "Your announcement is scheduled."
      : "Your announcement has been published.",
    data,
    202
  );
});

const list = handle(async (req, res) => {
  const data = await service.listAnnouncements(req.access, {
    search: req.query.search,
    page: req.query.page,
    status: req.query.status,
  });

  return successResponse(res, "Announcements retrieved", data);
});

const details = handle(async (req, res) => {
  const data = await service.getAnnouncementDetails(
    req.access,
    Number(req.params.id)
  );

  return successResponse(res, "Announcement retrieved", data);
});

const retry = handle(async (req, res) => {
  await service.retryAnnouncement(req.access, Number(req.params.id));
  return successResponse(res, "Retrying unsent emails.", null, 202);
});

const retryRecipient = handle(async (req, res) => {
  await service.retryRecipient(
    req.access,
    Number(req.params.id),
    Number(req.params.recipientId)
  );

  return successResponse(res, "Retrying this email.", null, 202);
});

const cancel = handle(async (req, res) => {
  await service.cancelScheduled(req.access, Number(req.params.id));
  return successResponse(res, "The scheduled announcement was cancelled.", null);
});

const pin = handle(async (req, res) => {
  await service.setPinned(req.access, Number(req.params.id), req.body.pinned);
  return successResponse(res, "Announcement updated.", null);
});

const remove = handle(async (req, res) => {
  await service.deleteAnnouncement(req.access, Number(req.params.id));
  return successResponse(res, "Announcement deleted.", null);
});

module.exports = {
  getOptions,
  searchMembers,
  preview,
  sendTest,
  create,
  list,
  details,
  retry,
  retryRecipient,
  cancel,
  pin,
  remove,
};