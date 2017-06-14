/**
 * Posts route
 *
 * v1/posts
 */
'use strict';

const async = require('async');
const redisClient = require('../lib/redis');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Media = require('../models/Media');
const formidable = require('formidable');
const auth = require('./middleware/auth');


module.exports = function (express) {
  const router = express.Router(); // eslint-disable-line new-cap

  /*==================================================*\

    GET - Public

  \*==================================================*/



  /**
   * Get all posts with pagination
   *
   * @response Object Array with posts and meta data
   *————————————————————————–————————————————————————–*/
  router.get('/', function (req, res, next) {

    const opt = {
      page: req.query.page || false,
      limit: req.query.limit || 10,
      group: req.query.group || false,
      search: req.query.q || false,
      as_array: true
    };

    if (opt.search) {
      return getPosts(req, res, next, opt);
    }

    const redisKey = `posts:${opt.page}_${opt.limit}_${opt.group}`;
    redisClient.get(redisKey, function (err, reply) {
      // return the cache
      if (reply) return res.json(JSON.parse(reply));

      getPosts(req, res, next, opt, redisKey);
    });
  });

  function getPosts(req, res, next, options, redisKey) {
    Post.getLatest(options, function (err, posts) {
      if (err) return next(err);
      if (!posts.length) return res.json({ posts: [], meta: 0 });

      // Pass group_id to the count if isset
      if (options.group) {
       options.group_id = posts[0].group_id;
      }

      Post.getTotalCount(options, function (err, total) {
        if (err) return next(err);

        const postResponse = { posts, meta: total[0] };
        redisClient.set(redisKey, JSON.stringify(postResponse));

        res.json(postResponse);
      });
    });
  }


  /**
   * Get a post's attached images
   *
   * @response Array of images in items
   *————————————————————————–————————————————————————–*/
  router.get('/:slug/media', function (req, res, next) {
    Post.findBySlug(req.params.slug, function (err, post) {
      if (err) return next(err);

      Media.getByPostId(post.get('id'), function (err, items) {
        if (err) return next(err);

        var images = [];

        items.forEach(function (img) {

          // Store the interesting image data
          var image = {
            id: img.id,
            created_at: img.created_at,
            filename: img.filename,
            user_id: img.user_id
          };
          if (Media.isImage(img.mime)) {
 image.type = 'image';
}

          images.push(image);
        });

        res.json({ items: images });
      });
    });
  });




  /*=============================================*\

    Authorization

  \*=============================================*/
  router.use(auth.isAuthorized);



  /*==================================================*\

    GET - Auth

  \*==================================================*/


  /**
   * Get a single post with comments, user and images
   *
   * @response Single post with comments and media
   *————————————————————————–————————————————————————–*/
  router.get('/:slug/links/comments', function (req, res, next) {
    let user = req.user;

    // Get the post
    Post.find('slug', req.params.slug, function (err, post) {
      if (err) return next(err);

      // Verify that the user can view the post
      if (!post.isAuthorized(user)) return next(new Error('Not authorized!'));

      async.parallel({

        // Get all post comments
        comments: function (callback) {

          // If there is no comments don't even bother looking
          if (!post.get('comments_count')) return callback(null);

          Comment.getByPost(post.get('id'), callback);
        },

        // Get all media
        media: function (callback) {
          Media.getAll('post', post.get('id'), function (err, items) {
            if (err) return callback(err);

            // Generate the image sizes
            let media = items.map(function (item) {
              let media_item = {
                id: item.id,
                user_id: item.user_id,
                filename: item.filename
              };
              if (Media.isImage(item.mime)) {
                media_item.type = 'image';
              }
              return media_item;
            });

            return callback(null, media);
          });
        }
      }, function (err, result) {
        if (err) return next(err);

        // Create the json response
        let response = {
          posts: post.toJson(),
          included: {
            comments: result.comments || [],
            media: result.media || []
          }
        };

        return res.json(response);
      });

    }); // End find post
  });


  /**
   * Set a post as published
   *
   * @response Empty success
   *————————————————————————–————————————————————————–*/
  router.get('/:slug/publish', function (req, res, next) {
    Post.publish(req.params.slug, req.user.id, function (err) {
      if (err) return next(err);

      res.sendStatus(200);
    });
  });



  /*==================================================*\

    POST - Auth

  \*==================================================*/


  /**
   * Create a new post
   *
   * @response The post slug
   *————————————————————————–————————————————————————–*/
  router.post('/', function (req, res, next) {

    let data = req.body;
    data.user_id = req.user.id;

    // Populate the Post model
    let post = new Post(req.body);

    // Save the post and return success or validation errors
    post.save(function (err, model) {
      if (err) return next(err);

      // Send a redis call that the post is published
      if (model.get('publish')) {
        Post.trigger_published(model.get('id'));
        redisClient.delWildcard('posts:*', () => {});
      }

      res.status(200).json({ posts: { slug: model.get('slug') } });
    });


  });


  /**
   * Attach media to a post
   *
   * @response The uploaded files
   *————————————————————————–————————————————————————–*/
  router.post('/:slug/upload', function (req, res, next) {

    // Quick referens to the post and user ID
    var reqData = {
      user_id: req.user.id,
      type: 'post'
    };

    // 1. Check the user are allowed to add images to the post
    // 2. Check how many images has been uploaded
    async.parallel([
      async.apply(Post.isOwner, req.params.slug, reqData.user_id),
    ], function (err, results) {
      if (err) return next(err);

      reqData.post_id = results[0].id;

      console.log(results);

      var form = new formidable.IncomingForm();

      // Hash the image to prevend duplicates
      form.hash = 'sha1';
      form.maxFieldsSize = Media.maxFileSize;

      form.parse(req, function () {});

      // Get the file
      form.on('file', function (field, file) {

        file.mime = file.type;

        // Upload and save the file
        Media.uploadFile(file, reqData, function (err, files) {
          if (err) return next(err);

          return res.json({ images: files });
        }); // uploadFile
      }); // file.on
    }); // async.parallel

  });


  return router;
};
