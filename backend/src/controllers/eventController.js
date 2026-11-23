const { validationResult } = require("express-validator");

const {
  successResponse,
  errorResponse,
} = require("../utils/response");

const service = require("../services/eventService");

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

    console.error("Event error:", error.message);

    return errorResponse(
      res,
      "Something went wrong. Please try again shortly.",
      500
    );
  }
};

/* ---- Public website (no sign-in) ---- */

const publicList = handle(async (req, res) => {
  const data = await service.listPublic({
    limit: req.query.limit,
    fellowshipId: req.query.campus,
  });

  res.set("Cache-Control", "public, max-age=30");

  return successResponse(res, "Events retrieved", data);
});

const publicFeatured = handle(async (req, res) => {
  const data = await service.getPublicFeatured();

  res.set("Cache-Control", "public, max-age=30");

  return successResponse(res, "Featured event retrieved", data);
});

const publicDetail = handle(async (req, res) => {
  const data = await service.getPublicBySlug(req.params.slug);

  res.set("Cache-Control", "public, max-age=30");

  return successResponse(res, "Event retrieved", data);
});

/* ---- Dashboard (signed in) ---- */

const list = handle(async (req, res) => {
  const data = await service.listForUser(req.access, {
    scope: req.query.scope,
    search: req.query.search,
    page: req.query.page,
    fellowshipId: req.query.fellowshipId,
  });

  return successResponse(res, "Events retrieved", data);
});

const options = handle(async (req, res) => {
  const data = await service.getOptions(req.access);
  return successResponse(res, "Event options retrieved", data);
});

const details = handle(async (req, res) => {
  const data = await service.getForEdit(req.access, Number(req.params.id));
  return successResponse(res, "Event retrieved", data);
});

const create = handle(async (req, res) => {
  const data = await service.createEvent(req.access, req.body || {}, req.file);
  return successResponse(res, "Event created.", data, 201);
});

const update = handle(async (req, res) => {
  const data = await service.updateEvent(
    req.access,
    Number(req.params.id),
    req.body || {},
    req.file
  );

  return successResponse(res, "Event updated.", data);
});

const changeStatus = handle(async (req, res) => {
  await service.changeStatus(
    req.access,
    Number(req.params.id),
    req.body.status
  );

  return successResponse(res, "Event status updated.", null);
});

const remove = handle(async (req, res) => {
  await service.deleteEvent(req.access, Number(req.params.id));
  return successResponse(res, "Event deleted.", null);
});

/* ---- RSVP ---- */

const setRsvp = handle(async (req, res) => {
  const data = await service.setRsvp(
    req.access,
    Number(req.params.id),
    req.body || {}
  );

  return successResponse(res, "Your answer was saved.", data);
});

const removeRsvp = handle(async (req, res) => {
  await service.removeRsvp(req.access, Number(req.params.id));
  return successResponse(res, "Your answer was removed.", null);
});

const listRsvps = handle(async (req, res) => {
  const data = await service.listRsvps(req.access, Number(req.params.id));
  return successResponse(res, "Answers retrieved", data);
});

module.exports = {
  publicList,
  publicFeatured,
  publicDetail,
  list,
  options,
  details,
  create,
  update,
  changeStatus,
  remove,
  setRsvp,
  removeRsvp,
  listRsvps,
};