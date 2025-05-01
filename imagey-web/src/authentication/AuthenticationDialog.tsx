import { useEffect, useState } from "react";
import { deviceRepository } from "../device/DeviceRepository";
import EmailDialog from "./EmailDialog";
import PasswordDialog from "./PasswordDialog";
import { deviceService } from "../device/DeviceService";

interface AuthenticationDialogProperties {
  onKeyDecrypted: (key: JsonWebKey) => void;
}

export default function AuthenticationDialog({
  onKeyDecrypted,
}: AuthenticationDialogProperties) {
  const params = new URLSearchParams(window.location.search);
  const [user, setUser] = useState(
    params.get("email") ?? deviceRepository.loadUser(),
  );
  const [deviceId, setDeviceId] = useState<string>();
  useEffect(() => {
    if (user) {
      setDeviceId(deviceRepository.loadDeviceId(user));
    }
  }, [user]);
  if (!user) {
    return <EmailDialog onEmailSelected={(email) => setUser(email)} />;
  }
  if (!deviceId) {
    return (
      <PasswordDialog
        message={"Select device password"}
        onPasswordSelected={(password) =>
          deviceService.registerDevice(user, password).then((key) => {
            setDeviceId(deviceRepository.loadDeviceId(user));
            onKeyDecrypted(key);
          })
        }
      />
    );
  }
  return (
    <PasswordDialog
      message={"Input device password"}
      onPasswordSelected={(password) =>
        deviceService.setupDevice(user, password).then((key) => {
          onKeyDecrypted(key);
        })
      }
    />
  );
}
