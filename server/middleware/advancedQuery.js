export const advancedQuery = (model) => async (req, res, next) => {
  let query;

  const reqQuery = { ...req.query };

  const removeFields = ["select", "sort", "page", "limit"];
  removeFields.forEach((param) => delete reqQuery[param]);

  let queryStr = JSON.stringify(reqQuery);

  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  query = model.find(JSON.parse(queryStr));

  // Search support
  if (req.query.search) {
    query = model.find({
      $or: [
        { firstName: { $regex: req.query.search, $options: "i" } },
        { lastName: { $regex: req.query.search, $options: "i" } },
      ],
    });
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  const results = await query;

  res.advancedResults = {
    success: true,
    count: results.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: results,
  };

  next();
};