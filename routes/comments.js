/**
 * Comments
 *
 * /comments
 */
'use strict';

const Comment = require('../models/Comment');
const Post = require('../models/Post');
const auth = require('./middleware/auth');

module.exports = function (express) {
  const router = express.Router(); // eslint-disable-line new-cap

  /*=============================================*\

    Authorization

  \*=============================================*/
  router.use(auth.isAuthorized);


  /**
   * POST
   *
   * create a comment
   */
  router.post('/', function (req, res, next) {

    // User has to be logged in to post
    if (!req.user || !req.user.id) {
      return res.statue(401).json({ error: 'Unauthorized, please log in first' });
    }

    let data = req.body;
    data.user = req.user;
    data.user_id = req.user.id;

    // Get the post
    Post.findBySlug(data.slug, (err, post) => {
      if (err) return next(err);

      data.post_id = post.get('id');

      // Save the post
      let comment = new Comment(data);
      comment.save(function (err, comment_model) {
        if (err) return next(err);

        Comment.trigger_published(comment_model.get('id'));

        res.status(200).json({ comment: comment_model.generateComment() });
      });

    });

  });

  return router;
};
