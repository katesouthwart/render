function paginateResults(req, res, model, populateOptions, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {};

  if (endIndex < model.length) {
    results.next = {
      page: page + 1,
      limit: limit
    };
  }

  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit
    };
  }

  return new Promise((resolve, reject) => {
  try {

    const queryResults = model.slice(startIndex, endIndex);

    results.results = queryResults;

    res.paginatedResults = results;
    resolve();

  } catch (err) {
    reject(err);
  }
});
}

module.exports = paginateResults;
