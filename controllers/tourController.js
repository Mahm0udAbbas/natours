const fs = require('fs');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
);

// Utiles
function hasNameAndPrice(obj) {
  return (
    obj &&
    typeof obj.name === 'string' &&
    obj.name.trim().length > 0 &&
    typeof obj.price === 'number' &&
    !isNaN(obj.price)
  );
}

// Validations

exports.checkId = (req, res, next, val) => {
  console.log(`Tour id is ${val}`);
  if (val > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invaild Id !',
    });
  }
  next();
};

exports.checkBody = (req, res, next) => {
  console.log(req.body);
  if (!hasNameAndPrice(req.body)) {
    return res.status(400).json({
      status: 'fail',
      message: 'invalid Name or price !',
    });
  }
  next();
};

// Controllers

exports.getAllTours = (req, res) => {
  res.status(200).json({
    message: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
};

exports.createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;

  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/../dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      if (err) return console.log(err);

      res.status(201).json({
        status: 'success',
        data: {
          newTour,
        },
      });
    },
  );
};

exports.getTour = (req, res) => {
  const tourId = Number(req.params.id);
  const tour = tours.find((ele) => ele.id === tourId);

  res.status(200).json({
    message: 'success',
    data: {
      tour,
    },
  });
};

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '<Update Gose Here ....!>',
  });
};

exports.deleteTour = (req, res) => {
  const tourId = Number(req.params.id);
  if (tourId > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invaild Id !',
    });
  }

  res.status(204).json({
    status: 'success',
    message: null,
  });
};
