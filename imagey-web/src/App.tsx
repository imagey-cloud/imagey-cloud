import { useEffect, useState } from "react";
import Icon from "@mdi/react";
import { mdiImageMultiple } from "@mdi/js";
import "./App.css";
import { deviceRepository } from "./device/DeviceRepository";
import { deviceService } from "./device/DeviceService";
import EmailDialog from "./authentication/EmailDialog";

function App() {
  /*
  There are different situations how we come to here:
  1. "currentUser" local storage property is not set.
     User has to put in her/his email address and the symmetric key is tried to receive.
     a) Symmetric key is gotten, "currentUser" obviously was lost and has to be set.
        Go on with 2.
     b) Symmetric key cannot be found. Trigger registration mail.
     c) Symmetric key cannot be received, because the user is not authenticated. Trigger login mail. 
  2. "currentUser" local storage property is set.
     Symmetric key is tried to receive.
     a) Symmetric key cannot be found. Trigger registration mail.
     b) Symmetric key cannot be received, because the user is not authenticated. Trigger login mail. 
     c) Symmetric key can be received.
        - Successfully decrypt private key. User is logged in.
        - Private key cannot be decrypted.
          Either device id is missing or private key is missing or something else went wrong.
          Device has to be reregistered.
          - Create and register device id and encrypt private key. User is logged in.
  3. User comes with login token
     Set "currentUser" local storage property and go on with 2. 
  4. User comes with registration token.
     Create symmetric key, register device. User is logged in.
  */
  const params = new URLSearchParams(window.location.search);
  const [user, setUser] = useState(
    params.get("email") ?? deviceRepository.loadUser(),
  );
  const [privateKey, setPrivateKey] = useState<JsonWebKey>();
  useEffect(() => {
    if (user) {
      deviceService
        .setupDevice(user)
        .then((privateKey) => setPrivateKey(privateKey))
        .catch(() => setUser(undefined));
    }
  }, [user]);
  if (!user) {
    return <EmailDialog onEmailSelected={(email) => setUser(email)} />;
  }
  return (
    <>
      <div>
        <Icon path={mdiImageMultiple} size={10} />
      </div>
      <h1>Imagey</h1>
      <div className="card">
        <p>Store and share your images and documents safely.</p>
        <p>{privateKey ? "Private key loaded" : "Loading private key"}</p>
        <button>count is 1</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
