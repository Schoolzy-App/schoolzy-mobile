import { Ionicons } from "@expo/vector-icons";
import React, { memo, useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import { Colors } from "@/constants";
import { useDebounce } from "@/hooks";

import Input from "./Input";
import Text from "./Text";

export interface SearchBarProps {
  filter: (searchQuery: string) => void;
  disabled?: boolean;
  placeholder: string;
}

const SearchBar = memo<SearchBarProps>(
  ({ filter, disabled = false, placeholder }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);

    const handleSearchChange = useCallback((text: string) => {
      setSearchQuery(text);
    }, []);

    const clearSearch = useCallback(() => {
      setSearchQuery("");
    }, []);

    useEffect(() => {
      filter(debouncedSearch);
    }, [debouncedSearch, filter]);

    return (
      <Input
        renderLeft={() => (
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
        )}
        placeholder={placeholder}
        value={searchQuery}
        onChangeText={handleSearchChange}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        renderRight={() =>
          debouncedSearch.length > 0 ? (
            <Text variant="h3" style={styles.clearButton} onPress={clearSearch}>
              ✕
            </Text>
          ) : null
        }
      />
    );
  },
);

SearchBar.displayName = "SearchBar";
export default SearchBar;

const styles = StyleSheet.create({
  clearButton: {
    fontSize: 20,
    opacity: 0.5,
  },
});
