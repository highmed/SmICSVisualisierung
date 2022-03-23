#!/usr/bin/env bash
set -e

TARGET="../infection-control-system-2-release"

node -v
npm -v
npm run build
SOURCE_COMMIT=$( git log --pretty=oneline --color=never -n 1 )
TARGET_MESSAGE="mirror of: $SOURCE_COMMIT"

mkdir -p "$TARGET/build"
mkdir -p "$TARGET/src/server"
mkdir -p "$TARGET/test"
cp -Rf build/public "$TARGET/build/public"
cp -Rf src/server/* "$TARGET/src/server"
cp -Rf test/* "$TARGET/test"
cp -Rf package.json "$TARGET"
cp -Rf package-lock.json "$TARGET"
cp -Rf tsconfig.json "$TARGET"

BACK=$(pwd)
cd $TARGET
git add build/public src/server test package.json package-lock.json tsconfig.json
(git commit -m "$TARGET_MESSAGE" && git push) || true
cd "$BACK"
