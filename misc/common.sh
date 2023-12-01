# bash colors
RED='\033[31m'
GREEN='\033[32m'
ORANGE='\033[33m'
RESET='\033[0m'
BOLD='\033[1m'

HAS_ERRORS=false

# log functions
error() {
	ERROR="${RED}ERROR: "
	echo -e "${ERROR}$1${RESET}"
	HAS_ERRORS=true
}
fatal() {
	error "$1"
	exit 1
}
warning() {
	WARNING="${ORANGE}WARNING: "
	echo -e "${WARNING}$1${RESET}"
	HAS_ERRORS=true
}
ok() {
	OK="${BOLD}${GREEN}✓${RESET}${GREEN} "
	echo -e "${OK}$1${RESET}"
}
doYouWantToContinue() {
	echo -e "Do you want to continue? (${BOLD}y${RESET}/${BOLD}n${RESET})"
	read -p "> " -n 1 -r
	echo
	if [[ ! $REPLY =~ ^[Yy]$ ]]
	then
		exit
	fi
}