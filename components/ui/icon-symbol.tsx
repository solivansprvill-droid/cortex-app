// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols → Material Icons mapping
 */
const MAPPING: IconMapping = {
  "house.fill": "home",
  "globe": "language",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "message.fill": "chat",
  "clock.fill": "history",
  "gearshape.fill": "settings",
  "plus": "add",
  "trash.fill": "delete",
  "xmark": "close",
  "arrow.up.circle.fill": "send",
  "stop.circle.fill": "stop-circle",
  "doc.on.clipboard": "content-copy",
  "square.and.pencil": "edit",
  "checkmark": "check",
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "warning",
  "eye": "visibility",
  "eye.slash": "visibility-off",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "arrow.left": "arrow-back",
  "ellipsis": "more-horiz",
  "cpu": "memory",
  "bolt.fill": "bolt",
  "wifi": "wifi",
  "wifi.slash": "wifi-off",
  "antenna.radiowaves.left.and.right": "router",
  "play.fill": "play-arrow",
  "play.circle.fill": "play-circle",
  "arrow.clockwise": "refresh",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "clock.badge.questionmark": "schedule",
  "minus.circle": "remove-circle-outline",
  // Agent features
  "brain": "psychology",
  "wand.and.stars": "auto-fix-high",
  "sparkles": "auto-awesome",
  "wrench.and.screwdriver.fill": "build",
  "hammer.fill": "construction",
  "function": "functions",
  "doc.text": "description",
  "chart.bar": "bar-chart",
  "lightbulb": "lightbulb",
  "list.bullet.clipboard": "assignment",
  "graduationcap": "school",
  "checkmark.seal": "verified",
  "ant": "bug-report",
  "pencil": "edit",
  "magnifyingglass": "search",
  "cloud.sun": "wb-sunny",
  "link": "link",
  "server.rack": "dns",
  "calendar.badge.clock": "event",
  "person.fill": "person",
  "person.circle": "account-circle",
  "face.smiling": "sentiment-satisfied-alt",
  "text.bubble.fill": "forum",
  "mic.fill": "mic",
  "mic.slash.fill": "mic-off",
  "waveform": "graphic-eq",
  "folder.fill": "folder",
  "doc.fill": "insert-drive-file",
  "network": "hub",
  "arrow.triangle.2.circlepath": "sync",
  "star.fill": "star",
  "bookmark.fill": "bookmark",
  "tag.fill": "label",
  "plus.circle.fill": "add-circle",
  "key.fill": "vpn-key",
  "arrow.down.circle": "download",
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name] ?? "help-outline";
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
