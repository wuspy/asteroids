#!/bin/sh

if [ ! "$1" ]; then
    echo "A package name is required"
    exit 1
fi;

if [ ! -f "Dockerfile.$1" ] || [ ! -f "$1/package.json" ]; then
    echo Invalid package \"$1\"
    exit 1
fi;

package_json_get() {
    cat $1/package.json \
        | grep $2 \
        | head -1 \
        | awk -F: '{ print $2 }' \
        | sed 's/[ @\t\r",]//g'
}

VERSION=$(package_json_get $1 version)
NAME=$(package_json_get $1 name)

echo "Building $NAME:$VERSION"
# docker build --no-cache -f Dockerfile.$1 --build-arg npm_package_version=$VERSION -t $NAME:v$VERSION .
