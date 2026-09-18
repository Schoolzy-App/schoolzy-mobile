import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Pdf from "react-native-pdf";

import type { ColorPalette } from "@/apps";
import { ScreenTemplate } from "@/components/ui";
import { useStyles } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";

// Fallback used when no `uri` is passed (e.g. screens not yet wired to the API).
// Metro resolves this through `assetExts: ["pdf"]` in metro.config.js.
const SAMPLE_PDF = require("@/assets/sample-document.pdf");

type Props = RootStackScreenProps<"Pdf">;

export default function PdfScreen({ route }: Props) {
  const styles = useStyles(createStyles);
  const { title, uri, headers } = route.params;

  // A new source object on every render would restart the PDF download.
  const source = useMemo(
    () => (uri ? { uri, headers, cache: true } : SAMPLE_PDF),
    [uri, headers],
  );

  return (
    <ScreenTemplate title={title}>
      <View style={styles.viewer}>
        <Pdf source={source} style={styles.pdf} trustAllCerts={false} />
      </View>
    </ScreenTemplate>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    viewer: {
      flex: 1,
      width: "100%",
      backgroundColor: colors.background,
    },
    pdf: {
      flex: 1,
      width: "100%",
    },
  });
