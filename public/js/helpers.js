const dayjs = require("dayjs");
var relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)

//Format timeline, post, and comment timestamps
function formatTimestamp(timestamp) {
  const now = dayjs();
  const postTime = dayjs(timestamp);

  if (now.diff(postTime, 'day') <= 2) {
    return postTime.fromNow();
  } else {
    return postTime.format("DD-MM-YY");
  }
}

//Format user creation date
function formatJoinedDate(date) {
  const createdTime = dayjs(date);
  return createdTime.format("MMMM YYYY");
}

module.exports = {
  formatTimestamp,
  formatJoinedDate,
};
