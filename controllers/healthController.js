const mongoose = require('mongoose');

exports.live = (req, res) => res.status(200).json({ status: 'ok' });

exports.ready = (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res
    .status(ready ? 200 : 503)
    .json({ status: ready ? 'ready' : 'unavailable' });
};
