(() => {
  const dialogSelector =
    "#profile-modal, #project-modal, #image-lightbox, #contact-modal, #achievement-modal";

  const moveDialogsToRoot = (root) => {
    if (!(root instanceof Element)) return;

    if (root.matches(dialogSelector) && root.parentElement !== document.documentElement) {
      document.documentElement.append(root);
    }

    root.querySelectorAll(dialogSelector).forEach((dialog) => {
      document.documentElement.append(dialog);
    });
  };

  moveDialogsToRoot(document.body);

  const dialogObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach(moveDialogsToRoot);
    });
  });
  dialogObserver.observe(document.body, { childList: true, subtree: true });

  const overlay = document.createElement("div");
  overlay.id = "global-image-lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Image preview");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:2147483647",
    "display:none",
    "align-items:center",
    "justify-content:center",
    "padding:24px",
    "background:rgba(0,0,0,.86)",
    "backdrop-filter:blur(5px)"
  ].join(";");

  const preview = document.createElement("img");
  preview.alt = "";
  preview.style.cssText = [
    "display:block",
    "max-width:92vw",
    "max-height:90vh",
    "object-fit:contain",
    "border-radius:12px",
    "box-shadow:0 24px 60px rgba(0,0,0,.45)"
  ].join(";");

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close image preview");
  closeButton.textContent = "×";
  closeButton.style.cssText = [
    "position:absolute",
    "top:16px",
    "right:16px",
    "width:44px",
    "height:44px",
    "border:0",
    "border-radius:50%",
    "background:rgba(255,255,255,.16)",
    "color:white",
    "font-size:30px",
    "line-height:1",
    "cursor:pointer"
  ].join(";");

  overlay.append(preview, closeButton);
  document.documentElement.append(overlay);

  const close = () => {
    overlay.style.display = "none";
    document.body.classList.remove("overflow-hidden");
  };

  closeButton.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });

  document.querySelectorAll("img").forEach((image) => {
    if (!image.closest("#profile-modal, #image-lightbox")) {
      image.style.cursor = "zoom-in";
    }
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof HTMLImageElement)) return;

    const image = event.target;
    if (image.closest("#global-image-lightbox, #profile-modal, #image-lightbox")) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    preview.src = image.currentSrc || image.src;
    preview.alt = image.alt || "Image preview";
    overlay.style.display = "flex";
    document.body.classList.add("overflow-hidden");
    closeButton.focus({ preventScroll: true });
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.style.display !== "none") close();
  });
})();