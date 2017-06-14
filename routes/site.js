'use strict';
/**
 * The visable site
 */

module.exports = function (express) {
 const router = express.Router(); // eslint-disable-line new-cap


  router.get('/languages/:lang.json', function (req, res) {
    const lang = req.params.lang === 'en' ? 'en' : 'fr';
    res.json(require('../views/languages/' + lang + '.json'));
  });


  // Anguar partials
  router.get('/partials/:partial/:partTwo?', function (req, res) {
    var partial = req.params.partial;
    if (req.params.partTwo) partial += '/' + req.params.partTwo;
    res.render('partials/' + partial);
  });

  // All the pages
  router.get('*', function (req, res) {
    res.render( 'index' );
  });

  return router;
};
