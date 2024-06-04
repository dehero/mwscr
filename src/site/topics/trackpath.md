# TrackPath

[A plugin](./allowed-mods.md) that allows you to record the player's movement along three coordinates and play it back
smoothly later. Suitable for preparing smooth movement through the game world when shooting video. Works well only on
the [OpenMW](./openmw.md) engine.

To start recording the player's movement, open the console and type "set trackPath to 1". A message will appear that the
recording of path "PATH_NUMBER" has started. You need to memorize this number to be able to play the recorded path
later. Move your character around the game world. You can move between locations by activating doors; the recording of
movement will continue. To stop the recording of the player's movement, you need to type in the console "set trackPath
to 0".

Before playing the recorded path, you need to move the character to the original location, where the beginning of the
path is located. To play the recorded path "PATH_NUMBER", type in the console "set playPath to PATH_NUMBER". The path
will start playing, smoothly moving your character through the world. The transition between locations is not automatic.
You need to manually activate the doors when you are close to them to continue playing the path. You can interrupt
playing the path with the command "set playPath to 0".

[Download](/plugins/TrackPath.esp)
