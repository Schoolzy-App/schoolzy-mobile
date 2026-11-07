import React, { FC, useState } from "react";
import { Pressable } from "react-native";

import { Icons } from "@/constants";

import Input from "./Input";

const { EyeInactive, EyeActive } = Icons;

type PasswordInputProps = {
  label?: string;
  placeholder?: string;
  onSubmit?(value: string): void;
};

const PasswordInput: FC<PasswordInputProps> = ({
  label = "Password",
  placeholder = "Enter your password",
  onSubmit,
}) => {
  const [isSecured, setIsSecured] = useState<boolean>(true);

  return (
    <Input
      label={label}
      placeholder={placeholder}
      secureTextEntry={isSecured}
      change={onSubmit}
      renderLeft={() => <Icons.LockInactive />}
      renderRight={() => (
        <Pressable onPress={() => setIsSecured((v) => !v)} hitSlop={8}>
          {isSecured ? <EyeInactive /> : <EyeActive />}
        </Pressable>
      )}
    />
  );
};

export default PasswordInput;
