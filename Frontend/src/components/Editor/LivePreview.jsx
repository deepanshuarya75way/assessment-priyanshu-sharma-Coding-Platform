import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Editor from "@monaco-editor/react";

const INITIAL_HTML = `<h1>Hello World!</h1>
<p>Welcome to the live preview.</p>
<button id="demo">Click Me</button>`;

const INITIAL_CSS = `body {
  font-family: Arial, sans-serif;
  padding: 20px;
}

h1 {
  color: purple;
}

button {
  padding: 10px 16px;
  cursor: pointer;
}`;

const INITIAL_JS = `document.getElementById("demo").addEventListener("click", () => {
  alert("JavaScript is working!");
});`;

const LivePreview = () => {
  const [activeLanguage, setActiveLanguage] = useState("html");

  const [html, setHtml] = useState(INITIAL_HTML);
  const [css, setCss] = useState(INITIAL_CSS);
  const [js, setJs] = useState(INITIAL_JS);

  const [runtimeErrors, setRuntimeErrors] = useState([]);

  const iframeRef = useRef(null);

  // Listen for runtime errors from the sandboxed iframe.
  // Register the listener before the browser paints the iframe.
  useLayoutEffect(() => {
    const handleMessage = (event) => {
      if (
        event.source !== iframeRef.current?.contentWindow
      ) {
        return;
      }

      const data = event.data;

      if (!data || typeof data !== "object") {
        return;
      }

      if (data.type === "PREVIEW_CLEAR_ERRORS") {
        setRuntimeErrors([]);
      }

      if (data.type === "PREVIEW_RUNTIME_ERROR") {
        setRuntimeErrors((previous) => [
          ...previous.slice(-9),
          String(data.message || "Unknown runtime error"),
        ]);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Generate the document rendered inside the iframe.
  const previewDocument = useMemo(() => {
    // Prevent user code from accidentally closing our script element.
    const safeJs = js.replace(
      /<\/script/gi,
      "<\\/script"
    );

    const safeCss = css.replace(
      /<\/style/gi,
      "<\\/style"
    );

    const errorHandler = `
      window.addEventListener("error", function(event) {
        parent.postMessage({
          type: "PREVIEW_RUNTIME_ERROR",
          message: event.message || "JavaScript runtime error"
        }, "*");
      });

      window.addEventListener("unhandledrejection", function(event) {
        parent.postMessage({
          type: "PREVIEW_RUNTIME_ERROR",
          message: String(event.reason || "Unhandled promise rejection")
        }, "*");
      });

      parent.postMessage({
        type: "PREVIEW_CLEAR_ERRORS"
      }, "*");
    `;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <style>
    ${safeCss}
  </style>

  <script>
    ${errorHandler}
  <\/script>
</head>

<body>
  ${html}

  <script>
    ${safeJs}
  <\/script>
</body>
</html>`;
  }, [html, css, js]);

  const getEditorValue = () => {
    switch (activeLanguage) {
      case "html":
        return html;

      case "css":
        return css;

      case "javascript":
        return js;

      default:
        return html;
    }
  };

  const handleEditorChange = (value) => {
    const newValue = value || "";

    switch (activeLanguage) {
      case "html":
        setHtml(newValue);
        break;

      case "css":
        setCss(newValue);
        break;

      case "javascript":
        setJs(newValue);
        break;

      default:
        break;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-950 text-white">

      {/* Language tabs */}
      <div className="flex gap-2 border-b border-gray-700 p-3">

        {["html", "css", "javascript"].map((language) => (
          <button
            key={language}
            type="button"
            onClick={() => setActiveLanguage(language)}
            className={`rounded px-3 py-2 text-sm ${
              activeLanguage === language
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-300"
            }`}
          >
            {language === "javascript"
              ? "JavaScript"
              : language.toUpperCase()}
          </button>
        ))}

      </div>

      {/* Editor and preview */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-2">

        {/* Monaco editor */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded border border-gray-700">

          <div className="border-b border-gray-700 bg-gray-900 p-2 text-sm">
            {activeLanguage.toUpperCase()} Editor
          </div>

          <div className="min-h-[300px] flex-1">
            <Editor
              height="100%"
              language={activeLanguage}
              theme="vs-dark"
              value={getEditorValue()}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                automaticLayout: true,
                fontSize: 14,
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
            />
          </div>

        </div>

        {/* Sandboxed live preview */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded border border-gray-700">

          <div className="border-b border-gray-700 bg-gray-900 p-2 text-sm">
            Live Preview
          </div>

          <iframe
            ref={iframeRef}
            title="HTML CSS JavaScript Preview"
            sandbox="allow-scripts"
            srcDoc={previewDocument}
            className="min-h-[300px] w-full flex-1 bg-white"
          />

        </div>

      </div>

      {/* Runtime errors */}
      <div className="max-h-32 overflow-y-auto border-t border-gray-700 p-3">

        <h3 className="mb-2 text-sm font-semibold">
          Runtime Errors
        </h3>

        {runtimeErrors.length === 0 ? (
          <p className="text-sm text-green-400">
            No runtime errors.
          </p>
        ) : (
          runtimeErrors.map((error, index) => (
            <p
              key={`${index}-${error}`}
              className="break-words text-sm text-red-400"
            >
              {error}
            </p>
          ))
        )}

      </div>

    </div>
  );
};

export default LivePreview;