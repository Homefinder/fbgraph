var request      = require('request')
  , querystring  = require('querystring')
  , url          = require('url')
  , noop         = function(){};

var oauthDialogUrl       = "http://www.facebook.com/dialog/oauth?"
  , oauthDialogUrlMobile = "http://m.facebook.com/dialog/oauth?";

exports.version = '0.2.1';

function Facebook(options, req, res) {
  this.options = options;
  this.requestOptions = {};
  this.req = req || {};
  this.res = res || {};
  this.graphUrl = 'https://graph.facebook.com';
  return this;
};

function Graph(facebook, method, url, postData, callback) {
  if (typeof callback === 'undefined') {
    callback  = postData;
    postData  = {};
  }
  this.facebook = facebook;
  url           = facebook.graphUrl + this.cleanUrl(url);
  this.callback = callback || noop;
  this.postData = postData;
  this.options                = this.facebook.requestOptions;
  this.options.encoding       = this.options.encoding || 'utf-8';
  this.options.method         = method;
  this.options.uri            = url;
  this.options.followRedirect = false;
  this[method.toLowerCase()]();
  return this;
};

Graph.prototype.cleanUrl = function(url) {
  var self = this;
  if (url.charAt(0) !== '/') url = '/' + url;
  if (self.facebook.getToken()) {
    url += ~url.indexOf('?') ? '&' : '?';
    url += "access_token=" + self.facebook.getToken();
  }
  return url;
};

Graph.prototype.end = function(body) {
  var json = typeof body === 'string' ? null : body
    , err  = null;
  if (!json) {
    try {
      if (~body.indexOf('{') && ~body.indexOf('}')) {
        json = JSON.parse(body);
      } else {
        if (!~body.indexOf('='))    body = 'data=' + body;
        if (body.charAt(0) !== '?') body = '?' + body;
        json = url.parse(body, true).query;
      }
    } catch (e) {
      err = {
          message: 'Error parsing json'
        , exception: e
      };
    }
  }
  if (!err && (json && json.error)) err = json.error;
  if (err && err.type === 'OAuthException') {
    var redirectUrl = this.facebook.redirectUri();
    return this.facebook.res.redirect(redirectUrl);
  } else {
    this.callback(err, json);
  }
};

Graph.prototype.get = function() {
  var self = this;
  request.get(this.options, function(err, res, body) {
    if (err) {
      self.callback({
          message: 'Error processing https request'
        , exception: err
      }, null);
      return;
    }
    if (~res.headers['content-type'].indexOf('image')) {
      body = {
          image: true
        , location: res.headers.location
      };
    }
    self.end(body);
  });
};

Graph.prototype.post = function() {
  var self     = this
    , postData = querystring.stringify(this.postData);
  this.options.body = postData;
  request(this.options, function (err, res, body) {
    if (err) {
      self.callback({
          message: 'Error processing https request'
        , exception: err
      }, null);
      return;
    }
    self.end(body);
  });
};

Facebook.prototype.get = function(url, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params   = null;
  }
  if (typeof url !== 'string') {
    return callback({ message: 'Graph api url must be a string' }, null);
  }
  if (params) url += '?' + querystring.stringify(params);
  return new Graph(this, 'GET', url, callback);
};

Facebook.prototype.post = function(url, postData, callback) {
  var self = this;
  if (typeof url !== 'string') {
    return callback({ message: 'Graph api url must be a string' }, null);
  }
  if (typeof postData === 'function') {
    callback = postData;
    postData = { access_token: self.getToken() };
  }
  return new Graph(this, 'POST', url, postData, callback);
};

Facebook.prototype.del = function(url, callback) {
  if (!url.match(/[?|&]method=delete/i)) {
    url += ~url.indexOf('?') ? '?' : '&';
    url += 'method=delete';
  }
  this.post(url, callback);
};

Facebook.prototype.search = function(options, callback) {
  options = options || {};
  var url = '/search?' + querystring.stringify(options);
  return this.get(url, callback);
};

Facebook.prototype.fql = function(query, callback) {
  if (typeof query !== 'string') query = JSON.stringify(query);
  var url = '/fql?q=' + encodeURIComponent(query);
  return this.get(url, callback);
};

Facebook.prototype.getOauthUrl = function(opts) {
  var params = {
    'client_id': this.options.appId,
    'redirect_uri': this.redirectUri(),
    'scope': this.options.scope
  };
  var url = (opts && opts.mobile) ? oauthDialogUrlMobile : oauthDialogUrl;
  return url + querystring.stringify(params);
};

Facebook.prototype.authorize = function(code, callback) {
  var self = this;
  var params = {
    'client_id': this.options.appId,
    'redirect_uri': this.redirectUri(),
    'client_secret': this.options.appSecret,
    'code': code
  };
  this.get('/oauth/access_token', params, function(err, res) {
    if (!err) self.req.session.facebookToken = res.access_token;
    callback(err, res);
  });
};

Facebook.prototype.redirectUri = function() {
  var url = this.options.redirectBase + this.req.url;
  return url.split('?')[0];
};

Facebook.prototype.getToken = function() {
  var currentUser = this.req.currentUser || {};
  var facebookToken = currentUser.facebookToken || undefined;
  return facebookToken || this.req.session.facebookToken;
};

exports.middleware = function(options) {
  options = options || {};
  return function(req, res, next) {
    req.facebook = new Facebook(options, req, res);
    next();
  };
};

