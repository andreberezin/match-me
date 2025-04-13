export const handleCloseMenu = (selected) => {
	if (selected.length >= 3) {
		document.activeElement.blur();
	}
};