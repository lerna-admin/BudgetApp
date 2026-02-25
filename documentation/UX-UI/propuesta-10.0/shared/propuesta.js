function budgetAppFindFrameByName(name) {
  return document.querySelector(`iframe[name="${CSS.escape(name)}"]`);
}

window.addEventListener("message", (event) => {
  const data = event?.data;
  if (!data || data.type !== "budgetapp:resize") {
    return;
  }

  const frame = budgetAppFindFrameByName(data.id);
  if (!frame) {
    return;
  }

  const height = Number(data.height);
  if (!Number.isFinite(height) || height <= 0) {
    return;
  }

  frame.style.height = `${Math.min(Math.max(height, 240), 4000)}px`;
});

