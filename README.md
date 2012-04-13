# Stay Classy, Facebook

[FBgraph](http://criso.github.com/fbgraph/) is a nodejs module that provides easy access to the facebook graph api

## malkomalko rewrite?

I noticed that things were going horribly wrong because there was one single
access token being shared by all users.  My goal is to refactor this out using
connect middleware to make things more contained and more simple.

Right now I'm hacking up something that works, gutting the tests, and will write
a readme when I'm done.

Thanks goes out to Cristiano for putting a lot of the leg work in this.  If you
have any questions in the meantime before things are more fleshed out, let me
know.

## Quickstart

```javascript
// add to your package.json dependencies

"fbgraph": "https://github.com/malkomalko/fbgraph/tarball/master"

// setup express app middleware, make sure it comes after session middleware

var graph = require('fbgraph');

app.configure(function() {
  ...
  app.use(express.session(..));
  app.use(graph.middleware({
    appId: 'your_app_id',
    appSecret: 'your_app_secret',
    scope: 'list, of, permissions',
    redirectUri: 'http://your/redirect/url'
  }));
  ...
});

/**
 * with that setup, you now have access to req.facebook with most of the same options as fbgraph
 * - ex: req.facebook.get, req.facebook.authorize... etc
 */

// setup your redirect url for login/registration

app.get('/redirect/url', function(req, res) {
  if (req.facebook.accessToken) {
    req.flash('info', 'You are already authenticated.');
    return res.redirect('/already/logged_in/url');
  }

  if (!req.query.code) {
    return res.redirect(req.facebook.getOauthUrl());
  }

  if (!req.query.error) {
    req.facebook.authorize(req.query.code, function(err, result) {
      if (err) {
        req.flash('error', 'There was an error logging in.');
        return res.redirect('/some/error/url');
      }   

      req.flash('success', 'We are a go....');
      res.redirect('/some/logged_in/url');
    }); 
  } else {
    req.flash('error', 'There was an error logging in.');
    res.redirect('/some/error/url');
  }
});
```

## License

(The MIT License)

Copyright (c) 2011 Cristiano Oliveira &lt;ocean.cris@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

