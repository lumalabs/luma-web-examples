#!/bin/bash

# include common.sh
source ./misc/common.sh

# Ensure the script stops if any command fails
set -e
# set -x

# Get the version of the package @lumaai/luma-web
version_info=$(npm list --depth=0 | grep "@lumaai/luma-web")
# Extract just the version number
luma_package_version=$(echo $version_info | grep -oE '\b[0-9]+\.[0-9]+\.[0-9]+\b')
# Get the latest git commit hash
git_hash=$(git rev-parse --short HEAD)

# Check for gsutil, explain how to install it if not found
if ! command -v gsutil &> /dev/null
then
	fatal "Command \`gsutil\` could not be found, you need Google Cloud SDK CLI to publish (https://cloud.google.com/sdk/docs/install). Check it it available in PATH"
fi

# check we're in the root directory by the presence of package.json
if [ ! -f "package.json" ]
then
	fatal "You must run this script from the root directory of the project"
fi

# check if version is correct and if the user wants to continue
echo -e "@lumaai/luma-web version: ${BOLD}${luma_package_version}${RESET}"
doYouWantToContinue

echo -e "This will delete and rebuild ${BOLD}dist/${RESET}"
doYouWantToContinue

# Delete the dist directory
rm -rf dist
# Rebuild
npm run build

# Buckets:
# 	- prod: cdn-luma.com
# 	- sandbox: sandbox.cdn-luma.com
# Ask for user to type "prod" or "sandbox" publish and loop until valid input
publish_env=""
while [ "$publish_env" != "prod" ] && [ "$publish_env" != "sandbox" ]
do
	echo ""
	echo -e "Which bucket do you want to publish to? Type \"${BOLD}prod${RESET}\" or \"${BOLD}sandbox${RESET}\":"
	# display input caret
	read -p "> " publish_env
done

# Set bucket name based on user input
if [ "$publish_env" == "prod" ]
then
	bucket_name="cdn-luma.com"
else
	bucket_name="sandbox.cdn-luma.com"
fi

parent_path="public/lumalabs.ai/luma-web-library"
path="${parent_path}/${luma_package_version}/${git_hash}"

gsutil_dir="gs://${bucket_name}/${path}"

# Upload the root directory to Google Cloud Storage, overwriting any existing files
# excluding node_modules/, misc/, .git/, .DS_Store
EXCLUDE="node_modules/*|misc/*|.git/*|.*\.DS_Store"

# Dry run, add -n to only show what would be uploaded
gsutil -m rsync -r -d -n -x "${EXCLUDE}" ./ "${gsutil_dir}"

doYouWantToContinue

# Run the upload
gsutil -m rsync -r -d -x "${EXCLUDE}" ./ "${gsutil_dir}"

echo ""
ok "Files have been published"

public_url="https://${bucket_name}/${path}/index.html"
storage_url="https://console.cloud.google.com/storage/browser/${bucket_name}/${path}"

echo ""
echo -e "${BOLD}Public URL:${RESET} ${public_url}"
echo -e "${BOLD}Storage URL:${RESET} ${storage_url}"