import { useEffect, useState } from "react";
import "./imagey.css";
import { deviceRepository } from "./device/DeviceRepository";
import { deviceService } from "./device/DeviceService";
import EmailDialog from "./authentication/EmailDialog";
import Navigation from "./components/Navigation";
import { BrowserRouter, Route, Routes } from "react-router";
import Images from "./pages/Images";
import Image from "./pages/Image";
import Chats from "./pages/Chats";
import MenuButton from "./components/MenuButton";

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
    <BrowserRouter>
      <header>
        <MenuButton />
        <h1>Imagey</h1>
        <div className="action-bar" />
      </header>
      <div id="page">
        <Navigation style="rail" />
        <Routes>
          <Route path="/" element={<Images privateKey={privateKey} />} />
          <Route path="images">
            <Route index element={<Images privateKey={privateKey} />} />
            <Route path=":id" element={<Image />} />
          </Route>
          <Route path="chats" element={<Chats />} />
        </Routes>
        <aside></aside>
      </div>
    </BrowserRouter>
  );
}

export default App;
