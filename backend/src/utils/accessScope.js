const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Campuses (regular fellowships) whose members this person manages.
const getManagedCampusIds = (access) =>
  access?.scope?.memberFellowshipIds || [];

const canManageCampus = (access, fellowshipId) =>
  getManagedCampusIds(access).includes(Number(fellowshipId));

const assertCanManageCampus = (access, fellowshipId, message) => {
  if (!canManageCampus(access, fellowshipId)) {
    throw httpError(
      message || "You can only manage people in your own campus.",
      403
    );
  }
};

/*
 * Narrow to one campus ONLY if the person really manages it.
 * Anything else falls back to all the campuses they manage, so a campus
 * id typed into the URL can never widen their access.
 */
const pickCampusIds = (access, requested) => {
  const allowed = getManagedCampusIds(access);
  const id = Number(requested);

  if (Number.isInteger(id) && allowed.includes(id)) return [id];

  return allowed;
};

module.exports = {
  httpError,
  getManagedCampusIds,
  canManageCampus,
  assertCanManageCampus,
  pickCampusIds,
};