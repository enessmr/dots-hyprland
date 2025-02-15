#!/usr/bin/env bash
cd "$(dirname "$0")"
source ./scriptdata/environment-variables
source ./scriptdata/functions
prevent_sudo_or_root

function v() {
  echo -e "[$0]: \e[32mNow executing:\e[0m"
  echo -e "\e[32m$@\e[0m"
  "$@"
}

printf 'Hi there!\n'
printf 'This script 1. will uninstall [end-4/dots-hyprland > illogical-impulse] dotfiles\n'
printf '            2. will try to revert *mostly everything* installed using install.sh, so it'\''s pretty destructive\n'
printf '            3. has not been tested, use at your own risk.\n'
printf '            4. will show all commands that it runs.\n'
printf 'Ctrl+C to exit. Enter to continue.\n'
read -r
set -e
##############################################################################################################################

# Undo Step 3: Removing copied config and local folders
printf '\e[36mRemoving copied config and local folders...\n\e[97m'

for i in ags fish fontconfig foot fuzzel hypr mpv wlogout "starship.toml" rubyshot
  do v rm -rf "$XDG_CONFIG_HOME/$i"
done

v rm -rf "$XDG_BIN_HOME/fuzzel-emoji"
v rm -rf "$XDG_CACHE_HOME/ags"
v sudo rm -rf "$XDG_STATE_HOME/ags"

for i in "glib-2.0/schemas/com.github.GradienceTeam.Gradience.Devel.gschema.xml" "gradience"
  do v rm -rf "$XDG_DATA_HOME/$i"
done

##############################################################################################################################

# Undo Step 2: Uninstall AGS - Disabled for now, check issues
# echo 'Uninstalling AGS...'
# sudo meson uninstall -C ~/ags/build
# rm -rf ~/ags

##############################################################################################################################

# U̶n̶d̶o̶ S̶t̶e̶p̶ 1̶:̶ R̶e̶m̶o̶v̶e̶ a̶d̶d̶e̶d̶ u̶s̶e̶r̶ f̶r̶o̶m̶ v̶i̶d̶e̶o̶, i̶2̶c̶, a̶n̶d̶ i̶n̶p̶u̶t̶ g̶r̶o̶u̶p̶s̶ a̶n̶d̶ r̶e̶m̶o̶v̶e̶ y̶a̶y̶ p̶a̶c̶k̶a̶g̶e̶s̶
# Disabled due to can lead issues in packages.
# printf '\e[36mRemoving user from video, i2c, and input groups and removing packages...\n\e[97m'
# user=$(whoami)
# v sudo gpasswd -d "$user" video
# v sudo gpasswd -d "$user" i2c
# v sudo gpasswd -d "$user" input
# v sudo rm /etc/modules-load.d/i2c-dev.conf

##############################################################################################################################
read -p "Do you want to uninstall packages used by the dotfiles?\nCtrl+C to exit, or press Enter to proceed"

# Removing installed yay packages and dependencies
# Plasma browser integration not included due to can lead issues in KDE. (not tested yet!)
v yay -Rns hyprland-git illogical-impulse-{audio,backlight,basic,fonts-themes,gnome,gtk,microtex,portal,pymyc-aur,python,screencapture,widgets}

printf '\e[36mUninstall Complete.\n\e[97m'
