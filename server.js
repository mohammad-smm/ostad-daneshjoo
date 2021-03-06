var VERSION = '0.4.0';

var fs = require('fs');
var http = require('http');
var express = require('express');
var global = require('./global');
var routes = require('./routes');
var config = require('./config').config;
var adminModel = require('./models/admin');

var app = express();

var args = process.argv.splice(2);
var port = config.port;
if (args.length > 0){
    if (/^(80|8080|300[0-9])$/.test(args[0])){
        port = args[0];
    }
}

app.set('port', port);
app.set('encoding', config.encoding);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('salt', config.salt);
app.set('admin cookie', config.user.cookie);

var env = process.env.NODE_ENV || 'production';
if ('development' == env) {
    app.locals.pretty = true;

    var errorhandler = require('errorhandler')
    app.use(errorhandler());
}

var favicon = require('serve-favicon');
var morgan  = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('cookie-session')
var multipart = require('connect-multiparty');

app.use(express.static(__dirname + '/public/', {maxAge: 2592000000}));
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(morgan({format: 'dev'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multipart());
app.use(cookieParser(app.get('salt')));
app.use(session({signed: false}));

var settings = adminModel.readSetting();
var langs = require('./langs/en-US');
if (settings.siteinfo.lang != 'en-US'){
    if (fs.existsSync('./langs/' + settings.siteinfo.lang + '.js')){
        langs = require('./langs/' + settings.siteinfo.lang);
    }
}
app.locals.siteinfo = settings.siteinfo;
app.locals.langs = langs.content;

app.all('*', global.siteRelevant, global.currentNav, routes.user.checkLogin);

app.get('/', routes.index);
app.get('/index\/?(:page)?', routes.index);
app.get('/about', routes.about);
app.get('/rss(\.xml)?', routes.rss);
app.get('/404', routes.errors.pageNotFound);
app.get('/post/view/:id', routes.post.view);
app.get('/post/add', routes.post.add);
app.get('/post/admin\/?(:page)?', routes.post.admin);
app.get('/post/update/:id', routes.post.update);
app.get('/post/addtop/:id', routes.post.addtop);
app.get('/post/deltop/:id', routes.post.deltop);
app.get('/post/trash', routes.post.trash);
app.get('/post/trash/:id', routes.post.doTrash);
app.get('/post/restore/:id', routes.post.restore);
app.get('/post/remove/:id', routes.post.remove);
app.get('/post/upload', routes.post.upload);
app.get('/tag/view/:tag', routes.tag.view);
app.get('/user/login', routes.user.login);
app.get('/user/logout', routes.user.logout);
app.get('/user/passwd', routes.user.passwd);
app.get('/admin/setting', routes.admin.setting);
app.get('/admin/data', routes.admin.data);
app.get('/admin/backup', routes.admin.backup);

app.post('/post/add', routes.post.doAdd);
app.post('/post/update/:id', routes.post.doUpdate);
app.post('/post/upload', routes.post.doUpload);
app.post('/user/login', routes.user.doLogin);
app.post('/user/passwd', routes.user.doPasswd);
app.post('/admin/setting', routes.admin.doSetting);
app.post('/admin/restore', routes.admin.restore);
app.post('/admin/dorestore', routes.admin.doRestore);

app.get('*', routes.errors.pageNotFound);

var dataDirs = ['data', 'data/post', 'data/tag', 'data/trash', 'public/upload'];
for(var i=0; i<dataDirs.length; i++){
    if (!fs.existsSync(dataDirs[i])){
        fs.mkdirSync(dataDirs[i], 0755);
    }
}

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
