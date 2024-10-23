const observer = new MutationObserver(function (mutations, mutationInstance) {
  let parts = document.querySelectorAll("#sbo-rt-content > section > div > *");
  if (parts.length == 0) {
    parts = document.querySelectorAll("#sbo-rt-content > section > *");
  }

  if (parts.length > 0) {
    addTranslate(parts);
    fixFont();
    mutationInstance.disconnect();
  }
});

observer.observe(document, {
  childList: true,
  subtree: true,
});

function addTranslate(parts) {
  for (const part of parts) {
    if (part.textContent === "") continue;

    part.style.position = "relative";

    const contentWrapper = document.createElement("section");
    contentWrapper.dataset.lang = "en";
    contentWrapper.dataset.en = encodeURIComponent(part.innerHTML);
    contentWrapper.innerHTML = part.innerHTML;
    part.innerHTML = "";

    const btn = document.createElement("button");
    btn.textContent = "Translate";
    btn.classList.add("btn-translate");

    part.appendChild(btn);
    part.appendChild(contentWrapper);

    btn.addEventListener("click", async () => {
      if (!contentWrapper.dataset.vi) {
        btn.textContent = "Wait...";

        const translateResult = await translate(contentWrapper.innerHTML, true);
        if (!translateResult.success) {
          btn.textContent = "Translate";
          return;
        }

        contentWrapper.dataset.vi = encodeURIComponent(translateResult.text);
      }

      if (contentWrapper.dataset.lang === "en") {
        contentWrapper.innerHTML = decodeURIComponent(
          contentWrapper.dataset.vi
        );
        contentWrapper.dataset.lang = "vi";
        btn.textContent = "Revert";
      } else {
        contentWrapper.innerHTML = decodeURIComponent(
          contentWrapper.dataset.en
        );
        contentWrapper.dataset.lang = "en";
        btn.textContent = "Translate";
      }
    });
  }
}

async function translate(text, usePro) {
  let apiKey = localStorage.getItem("gemini_api_key");
  if (!apiKey) {
    apiKey = prompt("Input your Gemini API Key:", "").trim();
    localStorage.setItem("gemini_api_key", apiKey);
  }

  let model = "gemini-1.5-flash";
  if (usePro) {
    model = "gemini-1.5-pro";
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Translate this HTML to Vietnamese, ensuring fluency and suitability with the content's context, still keep software engineering terms and HTML tags unchanged (especially <em>), only output the result, without being wrapped in markdown codeblock format:\n\n${text}`,
              },
            ],
          },
        ],
      }),
    }
  );

  if (res.status == 400) {
    localStorage.removeItem("gemini_api_key");
    alert("Your Gemini API Key is invalid, try another key.");
    return {
      text: "",
      success: false,
    };
  }

  if (!res.ok) {
    if (usePro) {
      return translate(text, false);
    }
    alert("Failed, try again after a few seconds.");
    return {
      text: "",
      success: false,
    };
  }

  if (!usePro) {
    alert("Translated using Flash model because Pro model was failed.");
  }

  const result = await res.json();
  return {
    text: result.candidates[0].content.parts[0].text,
    success: true,
  };
}

function fixFont() {
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap');
    .ucvFamily-SanSerif #book-content #sbo-rt-content * {
      font-family: "Open Sans", sans-serif !important;
      font-optical-sizing: auto;
    }
  `;
  document.body.appendChild(style);
}
