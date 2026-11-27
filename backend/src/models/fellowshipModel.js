const db = require("../config/db");

/**
 * Campus fellowships a person can register in.
 * The General Fellowship is excluded: nobody is a direct member of it.
 */
const listRegularFellowships = async () => {
  const [rows] = await db.execute(
    `
      SELECT id, name, slug, code, description, logo_url
      FROM fellowships
      WHERE fellowship_type = 'regular'
        AND status = 'Active'
      ORDER BY id
    `
  );

  return rows;
};

const getFellowshipById = async (fellowshipId) => {
  const [rows] = await db.execute(
    `
      SELECT id, name, slug, code, fellowship_type, status
      FROM fellowships
      WHERE id = ?
      LIMIT 1
    `,
    [fellowshipId]
  );

  return rows[0] || null;
};

const listDepartments = async (fellowshipId) => {
  const [rows] = await db.execute(
    `
      SELECT id, name
      FROM departments
      WHERE fellowship_id = ?
        AND status = 'Active'
      ORDER BY name
    `,
    [fellowshipId]
  );

  return rows;
};

const countActiveDepartments = async (fellowshipId) => {
  const [rows] = await db.execute(
    `
      SELECT COUNT(*) AS total
      FROM departments
      WHERE fellowship_id = ?
        AND status = 'Active'
    `,
    [fellowshipId]
  );

  return Number(rows[0]?.total || 0);
};

const departmentBelongsToFellowship = async (
  departmentId,
  fellowshipId
) => {
  const [rows] = await db.execute(
    `
      SELECT id
      FROM departments
      WHERE id = ?
        AND fellowship_id = ?
        AND status = 'Active'
      LIMIT 1
    `,
    [departmentId, fellowshipId]
  );

  return rows.length > 0;
};

module.exports = {
  listRegularFellowships,
  getFellowshipById,
  listDepartments,
  countActiveDepartments,
  departmentBelongsToFellowship,
};