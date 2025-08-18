/**
 * A Svelte action to "teleport" a node to the document body.
 * This is useful for modals, tooltips, etc., to escape stacking contexts.
 * @param {HTMLElement} node The node to teleport.
 */
export function portal(node: HTMLElement) {
	document.body.appendChild(node);
	return {
		destroy() {
			// Check if the node is still in the body, as it might have been removed by other means.
			if (document.body.contains(node)) {
				document.body.removeChild(node);
			}
		}
	};
}
