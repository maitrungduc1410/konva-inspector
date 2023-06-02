import { useEffect, useState } from "react";
import "@pages/popup/Popup.css";
import checkIcon from "@assets/images/check-mark-icon.svg";
import logoIcon from "@assets/images/icon128.png";

const Popup = () => {
  const [isKonva, setIsKonva] = useState<boolean>(false);
  useEffect(() => {
    detect();
    const timeout = setInterval(detect, 3000);

    function detect() {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "__KONVA_DEVTOOLS__REQUEST_DETECTION" },
          function (response) {
            setIsKonva(response);
            if (response) {
              clearInterval(timeout);
            }
          }
        );
      });
    }

    return () => {
      clearInterval(timeout);
    };
  }, []);

  return (
    <div className="App">
      {isKonva ? (
        <>
          <b>
            <img className="check-icon" src={checkIcon} />
            Konva is detected
            <br />
          </b>
          Open DevTools and look for the Konva panel.
        </>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <img className="pulse" src={logoIcon} width={32} />
            Looking for Konva...
          </div>
          <div>
            Using <strong style={{ color: "#0f83cd" }}>Konva</strong>?
          </div>
          <div style={{ marginTop: 8 }}>
            After creating Konva app. Make sure to set it to Window object. Try
            to log it to console:
          </div>
          <div style={{ marginTop: 20, marginBottom: 10 }}>
            <code
              style={{
                backgroundColor: "#202020",
                color: "rgb(145, 168, 203)",
                padding: 8,
                borderRadius: 4,
              }}
            >
              console.log(window.Konva)
            </code>
          </div>
        </div>
      )}
    </div>
  );
};

export default Popup;
