console.log("validation du chargement en background");

chrome.sidePanel
	.setPanelBehavior({ openPanelOnActionClick: true })
	.catch((error) => console.error(error));