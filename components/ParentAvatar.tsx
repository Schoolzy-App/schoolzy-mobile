import React, { memo } from "react";

import { Icons } from "@/constants";

interface ParentAvatarProps {
  /** "Male" / "Female" as normalized by /home/current-user. Case-insensitive. */
  gender?: string;
  size?: number;
}

/**
 * The signed-in parent's avatar, chosen by the gender from
 * `/api/v1/home/current-user`.
 *
 * Anything other than "Female" — including a missing gender — uses the father
 * illustration rather than guessing, since the API returns gender as nullable.
 *
 * `boy-avatar` / `girl-avatar` are deliberately not used here: they are
 * children's illustrations and would misrepresent the account holder.
 */
const ParentAvatar = memo<ParentAvatarProps>(({ gender, size = 24 }) => {
  const isFemale = gender?.trim().toLowerCase() === "female";

  // Branch in JSX rather than picking a component into a variable: a component
  // chosen during render is a new type each pass, which remounts the subtree.
  return isFemale ? (
    <Icons.MotherAvatar width={size} height={size} />
  ) : (
    <Icons.FatherAvatar width={size} height={size} />
  );
});

ParentAvatar.displayName = "ParentAvatar";
export default ParentAvatar;
