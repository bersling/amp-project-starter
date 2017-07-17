/**
 * Compile markdown to html. This is only necessary since I display the README.md also on amp-project-starter.com.
 */
const fs = require('fs');
function translateReadmeFromMarkdownToHtml() {
  const showdown  = require('showdown'),
      converter = new showdown.Converter(),
      text      = fs.readFileSync('README.md', 'utf8');
  html      = converter.makeHtml(text);

  console.log(html);

  const writeStream = fs.createWriteStream(`./app/pages/readme.html`);
  writeStream.write(html, (err) => {
    console.log(err);
  });

}
translateReadmeFromMarkdownToHtml();
