import { useEffect, useState } from 'react';
import '@src/Popup.css';

const Popup = () => {
  const [isKonva, setIsKonva] = useState<boolean>(false);

  useEffect(() => {
    detect();
    const timeout = setInterval(detect, 3000);

    function detect() {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: '__KONVA_DEVTOOLS__REQUEST_DETECTION' }, function (response) {
            setIsKonva(response);
            if (response) {
              clearInterval(timeout);
            }
          });
        }
      });
    }

    return () => {
      clearInterval(timeout);
    };
  }, []);

  return (
    <div className="h-full w-[350px] p-[10px] text-center text-[16px]">
      {isKonva ? (
        <>
          <b className="flex justify-center">
            <img className="mr-[4px] w-[20px]" src={chrome.runtime.getURL('popup/check-mark-icon.svg')} />
            Konva is detected
            <br />
          </b>
          Open DevTools and look for the Konva panel.
        </>
      ) : (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}>
            <img className="pulse mr-[5px]" src={chrome.runtime.getURL('icon128.png')} width={32} />
            Looking for Konva...
          </div>
          <div>
            Using <strong style={{ color: '#0f83cd' }}>Konva</strong>?
          </div>
          <div style={{ marginTop: 8 }}>
            After creating Konva app. Make sure to set it to Window object. Try to log it to console:
          </div>
          <img style={{ width: '100%' }} src={chrome.runtime.getURL('popup/content-samples.png')} />
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            There&apos;re 2 ways of using Konva, if you&apos;re using the second one (Way 2) please follow as below:
          </div>
          <img style={{ width: '100%' }} src={chrome.runtime.getURL('popup/content-usage.png')} />
        </div>
      )}
    </div>
  );
};

export default Popup;
