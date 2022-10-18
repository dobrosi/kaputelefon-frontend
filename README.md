### Prepare to build
```console
npm install -g gulp-cli
npm install gulp --save-dev
npm install gulp-inline-source
```
### Build and deploy
```console
cd kaputelefon-frontend

gulp icons && \
gulp inlinesource && \
gzip -f < target/index.html > target/index.html.gz && \
curl -X PUT --data-binary @target/index.html.gz http://kaputelefon.local/file/html
```
