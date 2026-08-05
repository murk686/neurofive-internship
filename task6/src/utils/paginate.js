/**
 * Applies page/limit pagination to an array.
 * Returns the sliced data plus pagination metadata.
 */
const paginate = (array, page = 1, limit = 10) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const total = array.length;
  const totalPages = Math.ceil(total / l);
  const start = (p - 1) * l;
  const end = start + l;
  const data = array.slice(start, end);

  return {
    data,
    pagination: {
      total,
      page: p,
      limit: l,
      totalPages,
      hasNextPage: p < totalPages,
      hasPrevPage: p > 1,
    },
  };
};

module.exports = { paginate };
