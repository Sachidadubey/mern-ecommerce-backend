class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;//  mongo query {isActive:true-}
    this.queryString = queryString;// real query send by user
  }


  // filter

  filter() {
    const queryObj = { ...this.queryString };// copy of real queryString 
    const excludedFields = ["page", "sort", "limit",];
    excludedFields.forEach(ele => delete queryObj[ele]);// delete everyElements of excluded fields array from queryStried Which copied -
    
    // price filter

    if (queryObj.price) {
      this.query = this.query.find({
        price: {
          ...(queryObj.price.gte && { $gte: Number(queryObj.price.gte) }),
          ...(queryObj.price.lte && { $lte: Number(queryObj.price.lte) }),
        }
      });
    }
    return this;
  }

  // search

  search() {
    if (this.queryString.search) {
      this.query = this.query.find({
        name: {
          $regex: this.queryString.search,
          $options: "i",
        },
      });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort)
    {
      this.query=this.query.sort(this.queryString.sort)
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page || 1;
    const limit = this.queryString.limit || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
 
  
}

module.exports = ApiFeatures;