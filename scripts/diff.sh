# Copyright 2019-2026 @pezkuwi/extension authors & contributors
# SPDX-License-Identifier: Apache-2.0

#!/bin/bash

# build firefox target
yarn build:ff

# Reorg the builds to 
mkdir ff-diff

FILE_PATH="./ff-diff"

compare_directories() {
    local dir1=$1
    local dir2=$2

    # diff's own exit status decides; piped into sort it was always 0, so builds
    # that differed were reported as identical.
    if diff -qr "$dir1" "$dir2"; then
        echo "Builds are identical"
        exit 0
    else
        echo "Builds are not identical"
        exit 1
    fi
}

unzip_ff() {

    unzip -o master-ff-src.zip -d master-ff-src
    unzip -o master-ff-build.zip -d master-ff-build

    cd ./master-ff-src && yarn install && yarn build:ff && cd ..
}

mv ./master-ff-src.zip ./master-ff-build.zip "$FILE_PATH" && cd "$FILE_PATH"

unzip_ff

compare_directories ./master-ff-build ./master-ff-src/packages/extension/build
