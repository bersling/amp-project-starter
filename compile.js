const Mustache = require('mustache');
const fs = require('fs');
const path = require('path');
const ampHtmlValidator = require('amphtml-validator');

/**
 * Where the result is saved
 */
const outDirRoot = './dist';

/**
 * All partials (=components) need to be declared here
 */
const partialRootPath = './app/';
const buildPartial  = (partialPath) => {
  return fs.readFileSync(path.join(partialRootPath, partialPath), 'utf8');
}
const partials = {
  'styles': buildPartial('styles/styles.css'),
  'footer': buildPartial('components/footer/footer.html'),
  'header': buildPartial('components/header/header.html'),
  'logo': buildPartial('components/logo/main.html'),
  'readme': buildPartial('components/readme/readme.html'),
  'analytics': buildPartial('components/analytics.html'),
  'commonHead': buildPartial('components/common-head.html')
}

/**
 * Here you can define the pages you want to compile & include in your distribution folder.
 * By specifying this explicity you gain full control and can also have drafts (unpublished html files)
 */
const pagesRootPath = './app/pages';
const pages = ['index', 'articles/index'];
addPagesToDirectory('articles/category1', ['index', 'article1', 'article2'], pages);
addPagesToDirectory('articles/category2', ['index', 'article3'], pages);

/**
 * Some constants for your project
 */
const projectConstants = {
  projectUrl: 'http://amp-project-starter.com'
};

/**
 * execute all compilation steps
 */
compileSass();
copyRobotsTxt();
buildSitemap(pages);
compileMustache();
validateAmp(pages);

/**
 * From here on downwards are only some implementation details...
 * ==============================================================
 */
function validateAmp(pages) {
  pages.forEach(page => {
    ampHtmlValidator.getInstance().then(function (validator) {
      const input = fs.readFileSync(`dist/${page}.html`, 'utf8');
      const result = validator.validateString(input);
      ((result.status === 'PASS') ? console.log : console.error)(`AMP ${result.status} (${page})`);
      for (let ii = 0; ii < result.errors.length; ii++) {
        const error = result.errors[ii];
        let msg = 'line ' + error.line + ', col ' + error.col + ': ' + error.message;
        if (error.specUrl !== null) {
          msg += ' (see ' + error.specUrl + ')';
        }
        ((error.severity === 'ERROR') ? console.error : console.warn)(msg);
      }
    });
  });
}

function compileSass () {
  const sass = require('node-sass');
  const result = sass.renderSync({
    file: './app/styles/styles.scss',
    outFile: './app/styles/styles.css'
  });
  fs.writeFileSync('./app/styles/styles.css', result.css);
};

function copyRobotsTxt() {
  copyFile('./app/pages/robots.txt', './dist/robots.txt', function(err) {
    if (err) {
      console.error('Error on copying robots', err);
    }
  });
}

function compileMustache() {

  // ensure that all directories are created, so compilation doesn't fail
  pages.forEach(page => {
    mkdir('./dist/' + path.dirname(page));
  });

  pages.forEach(page => {
    const template = fs.readFileSync(path.join(pagesRootPath, `${page}.html`), {encoding: 'utf8'});
    const renderedPage = Mustache.render(template, {
      projectUrl: projectConstants.projectUrl
    }, partials);
    fs.writeFileSync(path.join(outDirRoot, `${page}.html`), renderedPage);
  })
}

function buildSitemap(pages) {
  let changedPages = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    changedPages.push({
      // remove 'index' and also remove '.' ...
      page: page.indexOf('index') > -1 ? (
        path.dirname(page) === '.' ? '' : path.dirname(page)
      ) : (
        page
      )
    });
  }
  const extendedData = {
    pages: changedPages,
    date: formatDate(new Date())
  };
  Object.assign(extendedData, projectConstants);
  const sitemapTemplate = fs.readFileSync('./app/pages/sitemap.xml.mustache', 'utf8');
  const renderedSitemap = Mustache.render(sitemapTemplate, extendedData);
  fs.writeFileSync('./dist/sitemap.xml', renderedSitemap);
}


/**
 * And even less interesting, here are some helper functions...
 * ============================================================
 */
function addPagesToDirectory (dirName, newPages, existingPages) {
  newPages.forEach(page => {
    existingPages.push(path.join(dirName, page));
  });
}

function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done(ex);
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

/**
 * synchronously creates directory (chain)
 * @param targetDir
 */
function mkdir (targetDir) {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(parentDir, childDir);
    if (!fs.existsSync(curDir)) {
      fs.mkdirSync(curDir);
    }

    return curDir;
  }, initDir);
};

/**
 * format date to YYYY-MM-DD
 */
function formatDate(date) {
  var mm = date.getMonth(); // getMonth() is zero-based
  var dd = date.getDate();

  return [date.getFullYear(),
    (mm>9 ? '' : '0') + mm,
    (dd>9 ? '' : '0') + dd
  ].join('-');
}
