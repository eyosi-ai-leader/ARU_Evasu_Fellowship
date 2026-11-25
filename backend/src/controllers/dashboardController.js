const dashboardService = require("../services/dashboardService");

async function getDashboardOverview(req, res, next) {
  try {
    const overview = await dashboardService.getDashboardOverview(
      req.access,
      { fellowshipId: req.query.fellowshipId }
    );

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyFellowshipProfile(req, res, next) {
  try {
    const data = await dashboardService.getMyFellowshipProfile(req.access);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getMyAnnouncements(req, res, next) {
  try {
    const data = await dashboardService.getMyAnnouncements(req.access);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function markAnnouncementRead(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid announcement" });
    }

    await dashboardService.markAnnouncementRead(req.access, id);

    return res.status(200).json({ success: true, data: null });
  } catch (error) {
    return next(error);
  }
}

async function getMyCircles(req, res, next) {
  try {
    const { type } = req.params;

    if (!["small-groups", "families", "ministries"].includes(type)) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const data = await dashboardService.getMyCircles(req.access, type);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getDashboardOverview,
  getMyFellowshipProfile,
  getMyAnnouncements,
  markAnnouncementRead,
  getMyCircles,
};