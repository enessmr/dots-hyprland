const { Gtk } = imports.gi;
import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

const { Box, EventBox, Button, Revealer } = Widget;
const { execAsync } = Utils;
import { MaterialIcon } from '../.commonwidgets/materialicon.js';
import { DEFAULT_OSK_LAYOUT, oskLayouts } from './data_keyboardlayouts.js';
import { setupCursorHoverGrab } from '../.widgetutils/cursorhover.js';

let keyboardJson = oskLayouts[DEFAULT_OSK_LAYOUT]; // Make this a let so it can be updated
let currentLayoutIndex = 0; // Initialize the layout index
const layouts = ["qwerty_full_us", "qwerty_full_trq", "qwertz_full"];

// Function to switch layouts
function switchLayout() {
    console.log("Switching layout..."); // Debugging log
    currentLayoutIndex = (currentLayoutIndex + 1) % layouts.length; // Cycle through layouts
    const newLayout = layouts[currentLayoutIndex];
    console.log("New layout:", newLayout); // Debugging log
    loadLayout(newLayout); // Function to load the new layout
}

// Function to load a new layout
function loadLayout(newLayout) {
    keyboardJson = oskLayouts[newLayout]; // Update the layout data
    refreshKeyboardUI(); // Refresh the UI to reflect the new layout
}

// Function to refresh the keyboard UI
function refreshKeyboardUI() {
    if (kbWindow) {
        const keyboardBody = kbWindow.get_children()[1]; // Get the keyboard body container
        const oldKeyboard = keyboardBody.get_children()[2]; // Get the old keyboard UI
        const newKeyboard = KeyboardItself(keyboardJson); // Create the new keyboard UI

        oldKeyboard.destroy(); // Remove the old keyboard UI
        keyboardBody.pack_end(newKeyboard, true, true, 0); // Add the new keyboard UI
        keyboardBody.show_all(); // Ensure the new UI is visible
    }
}

// Keyboard UI
const KeyboardItself = (kbJson) => Box({
    vertical: true,
    className: 'spacing-v-5',
    children: kbJson.keys.map(row => Box({
        vertical: false,
        className: 'spacing-h-5',
        children: row.map(key => Button({
            className: `osk-key osk-key-${key.shape}`,
            hexpand: ["space", "expand"].includes(key.shape),
            label: key.label,
            attribute: { key: key },
            setup: (button) => {
                let pressed = false;
                if (key.keytype == "normal") {
                    button.connect('pressed', () => execAsync(`ydotool key ${key.keycode}:1`).catch(print));
                    button.connect('clicked', () => execAsync(`ydotool key ${key.keycode}:0`).catch(print));
                } else if (key.keytype == "modkey") {
                    button.connect('pressed', () => {
                        if (pressed) {
                            execAsync(`ydotool key ${key.keycode}:0`).catch(print);
                            button.toggleClassName('osk-key-active', false);
                            pressed = false;
                        } else {
                            execAsync(`ydotool key ${key.keycode}:1`).catch(print);
                            button.toggleClassName('osk-key-active', true);
                            pressed = true;
                        }
                    });
                }
            }
        }))
    }))
});

// Keyboard Window
const KeyboardWindow = () => Box({
    vexpand: true,
    hexpand: true,
    vertical: true,
    className: 'osk-window spacing-v-5',
    children: [
        Box({ // Top Decor
            vertical: true,
            children: [
                Box({
                    hpack: 'center',
                    className: 'osk-dragline',
                    homogeneous: true,
                    children: [EventBox({ setup: setupCursorHoverGrab })]
                })
            ]
        }),
        Box({
            className: 'osk-body spacing-h-10',
            children: [
                Box({ // Controls
                    vertical: true,
                    className: 'spacing-v-5',
                    children: [
                        Button({
                            className: 'osk-control-button txt-norm icon-material',
                            onClicked: () => {
                                releaseAllKeys();
                                toggleWindowOnAllMonitors('osk');
                            },
                            label: 'keyboard_hide',
                        }),
                        Button({
                            className: 'osk-control-button txt-norm',
                            label: `${keyboardJson['name_short']}`,
                            onClicked: () => switchLayout()
                        }),
                        Button({
                            className: 'osk-control-button txt-norm icon-material',
                            onClicked: () => execAsync([`bash`, `-c`, "pkill fuzzel || cliphist list | fuzzel --match-mode fzf --dmenu | cliphist decode | wl-copy"]).catch(print),
                            label: 'assignment',
                        })
                    ]
                }),
                Widget.Box({ className: 'separator-line' }),
                KeyboardItself(keyboardJson), // Keyboard itself
            ],
        })
    ]
});

let kbWindow; // Global reference to the keyboard window

export default ({ id }) => {
    kbWindow = KeyboardWindow(); // Initialize the keyboard window
    const gestureEvBox = EventBox({ child: kbWindow });
    const gesture = Gtk.GestureDrag.new(gestureEvBox);

    gesture.connect('drag-begin', async () => {
        try {
            const Hyprland = (await import('resource:///com/github/Aylur/ags/service/hyprland.js')).default;
            Hyprland.messageAsync('j/cursorpos').then((out) => {
                gesture.startY = JSON.parse(out).y;
            }).catch(print);
        } catch {
            return;
        }
    });

    gesture.connect('drag-update', async () => {
        try {
            const Hyprland = (await import('resource:///com/github/Aylur/ags/service/hyprland.js')).default;
            Hyprland.messageAsync('j/cursorpos').then((out) => {
                const currentY = JSON.parse(out).y;
                const offset = gesture.startY - currentY;

                if (offset > 0) return;

                kbWindow.setCss(`margin-bottom: ${offset}px;`);
            }).catch(print);
        } catch {
            return;
        }
    });

    gesture.connect('drag-end', () => {
        const offset = gesture.get_offset()[2];
        if (offset > 50) {
            App.closeWindow(`osk${id}`);
        } else {
            kbWindow.setCss(`
                transition: margin-bottom 170ms cubic-bezier(0.05, 0.7, 0.1, 1);
                margin-bottom: 0px;
            `);
        }
    });

    return gestureEvBox;
};