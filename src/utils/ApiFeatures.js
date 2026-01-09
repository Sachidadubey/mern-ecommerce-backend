class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;               // Mongoose query
    this.queryString = queryString;   // req.query
    this.paginationResult = {};
  }

  /**
   * FILTER
   */
  filter() {
    const queryObj = { ...this.queryString };

    const excludedFields = ["page", "sort", "limit"];
    excludedFields.forEach(field => delete queryObj[field]);

    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt)\b/g,
      match => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  /**
   * COUNT TOTAL (AFTER FILTER, BEFORE PAGINATION)
   */
  async countTotal(model) {
    const countQuery = model.find(this.query.getFilter());
    this.paginationResult.total = await countQuery.countDocuments();
    return this;
  }

  /**
   * SORT
   */
  sort() {
    if (this.queryString.sort) {
       const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  /**
   * PAGINATION
   */
paginate(resultPerPage) {
  const currentPage = Number(this.queryString.page) || 1;
  const limit = resultPerPage;
  const skip = (currentPage - 1) * limit;

  this.query = this.query.limit(limit).skip(skip);

  const totalItems = this.paginationResult.total;
  const totalPages = Math.ceil(totalItems / limit);

  this.paginationResult = {
    totalItems,
    totalPages,
    currentPage,
    limit,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };

  return this;
}
}

module.exports = ApiFeatures;
