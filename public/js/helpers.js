const dayjs = require("dayjs");
var relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)

function formatTimestamp(timestamp) {
  const now = dayjs();
  const postTime = dayjs(timestamp);

  if (now.diff(postTime, 'day') <= 2) {
    return postTime.fromNow();
  } else {
    return postTime.format("DD-MM-YY");
  }
}

module.exports = {
  formatTimestamp,
};
