import { useActionIcons } from "../contexts/ActionBarContext";
import AddIcon from "../icons/AddIcon";

interface ImagesProperties {
  privateKey?: JsonWebKey;
}

export default function Images({ privateKey }: ImagesProperties) {
  const actionIcons = [(<a key="add" className="icon" onClick={() => alert("hallo")}><AddIcon key={"add-icon"}/></a>)];
  useActionIcons(actionIcons);
  return (
    <main>
      <p>{privateKey ? "Keine Bilder vorhanden" : "Bilder werden geladen"}</p>
    </main>
  );
}
