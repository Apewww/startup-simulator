# Update V1.1.4

## Changes:
- **Server Rack Panel Fix:** Fixed an issue where nodes placed in rack slots could only be sold via the close button. Changed the close button functionality to **Unequip**, allowing the node to be returned to the player's inventory instead of being sold immediately.
- Changed the close button styling in `ServerRoomView.tsx` from red (`sell`) to gray/white to reflect the non-destructive nature of unequipping.
- Users can still sell the node from the inventory panel once unequipped.
