KOTLIN_REPO="kotlin-repo"
DOCUSAURUS_REPO="docusaurus-repo"

cp -R $KOTLIN_REPO/build/dokka/htmlMultiModule/* $DOCUSAURUS_REPO/static/kdocs/
echo "KDocs copied to Docusaurus static/api directory"

cp $KOTLIN_REPO/CHANGELOG.md                $DOCUSAURUS_REPO/changelog/0-changelog.md

cp $KOTLIN_REPO/docs/contributing.md        $DOCUSAURUS_REPO/contributing/0-contributing.md
cp $KOTLIN_REPO/docs/code-of-conduct.md     $DOCUSAURUS_REPO/contributing/1-code-of-conduct.md
cp $KOTLIN_REPO/CODING-STYLE.md             $DOCUSAURUS_REPO/contributing/2-coding-style.md
cp $KOTLIN_REPO/DEVELOPER-ENVIRONMENT.md    $DOCUSAURUS_REPO/contributing/3-developer-environment.md
cp $KOTLIN_REPO/TESTING.md                  $DOCUSAURUS_REPO/contributing/4-testing.md
cp $KOTLIN_REPO/MAINTAINERS.md              $DOCUSAURUS_REPO/contributing/5-maintainers.md
echo "Markdown files copied successfully"

cat $KOTLIN_REPO/README.md >>  $DOCUSAURUS_REPO/docs/index.md
echo "README contents appended successfully"

# Replace auto links with []() links in markdown files
# https://github.com/mdx-js/mdx/issues/1049
for file in $DOCUSAURUS_REPO/contributing/*.md; do
  sed -i -E 's/<(https?:\/\/[^>]*)>/[\1](\1)/g' "$file"
done

echo "Auto links replaced successfully"