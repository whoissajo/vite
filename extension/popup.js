document.addEventListener('DOMContentLoaded', () => {
  const launchBtn = document.getElementById('launchFullApp');
  const toolButtons = document.querySelectorAll('.tool-tile');

  const openWorkbench = (toolId = 'dashboard') => {
    const url = chrome.runtime.getURL(`workbench.html?tool=${toolId}`);
    chrome.tabs.create({ url });
  };

  if (launchBtn) {
    launchBtn.addEventListener('click', () => {
      openWorkbench('dashboard');
    });
  }

  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = btn.getAttribute('data-tool');
      openWorkbench(toolId);
    });
  });
});

