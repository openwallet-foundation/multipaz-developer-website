cp -R kotlin-repo/build/dokka/htmlMultiModule/* docusaurus-repo/static/kdocs/
echo "KDocs copied to Docusaurus static/api directory"

cp kotlin-repo/README.md                        docusaurus-repo/overview/0-overview.md
cp kotlin-repo/CHANGELOG.md                     docusaurus-repo/changelog/0-changelog.md

cp kotlin-repo/docs/contributing.md             docusaurus-repo/contributing/0-contributing.md  
cp kotlin-repo/docs/code-of-conduct.md          docusaurus-repo/contributing/1-code-of-conduct.md  
cp kotlin-repo/docs/CODING-STYLE.md             docusaurus-repo/contributing/2-coding-style.md  
cp kotlin-repo/docs/DEVELOPER-ENVIRONMENT.md    docusaurus-repo/contributing/3-developer-environment.md  
cp kotlin-repo/docs/TESTING.md                  docusaurus-repo/contributing/4-testing.md  
cp kotlin-repo/docs/MAINTAINERS.md              docusaurus-repo/contributing/5-maintainers.md  
echo "Markdown files copied successfully"